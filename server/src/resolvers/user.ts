import { Resolver, Mutation, Arg, Ctx, Field, ObjectType, Query } from 'type-graphql';
import argon2 from 'argon2';
import { v4 } from 'uuid';

import { UsernamePasswordInput } from './UsernamePasswordInput';
import { MyContext } from './../types';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX, FRONTEND_URL } from './../constants';
import { validateRegister } from './../utils/validateRegister';
import { sendEmail } from './../utils/sendEmail';

import { User } from './../entities/User';
// import { getConnection } from 'typeorm';

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

// User resolver
@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<any> {
    if (!req.session.userId) {
      return null;
    }

    return await User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length < 6) {
      return {
        errors: [{ field: 'newPassword', message: 'password is too short. 6 chars at least' }],
      };
    }

    // Key to create and delete temporary link
    const key = FORGET_PASSWORD_PREFIX + token;

    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'Token valiadtion error. Looks like it expired. Retry again please :)',
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return {
        errors: [{ field: 'newPassword', message: "I'm sorry, user no longer exists..." }],
      };
    }

    // change password
    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(newPassword),
      }
    );

    await redis.del(key);

    // log in after changing password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string, @Ctx() { redis }: MyContext) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // do nothing to protect if email is registered
      return true;
    }

    const token = v4();

    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24); // 1 day to restore the password

    await sendEmail(email, `<a href='${FRONTEND_URL}/change-password/${token}'>Reset password</a>`);

    return true;
  }

  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);

    let user;
    try {
      user = await User.create({
        username: options.username,
        email: options.email,
        password: hashedPassword,
      }).save();
      // This is a query builder example
      // const results = await getConnection()
      //   .createQueryBuilder()
      //   .insert()
      //   .into(User)
      //   .values({
      //     username: options.username,
      //     email: options.email,
      //     password: hashedPassword,
      //   })
      //   .returning('*')
      //   .execute();
      // user = results.raw[0];
    } catch (e) {
      console.log('register error message: ', e.message);
      if (e.detail.includes('already exists') || e.code === '23505') {
        //duplicate username error
        return {
          errors: [
            { field: 'username', message: 'user with this username or email already exists' },
          ],
        };
      }
      return {
        errors: [
          {
            field: 'username',
            message: 'Sorry, some kind of server error. Try register again, please',
          },
        ],
      };
    }

    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );

    if (!user) {
      return { errors: [{ field: 'usernameOrEmail', message: "That username doesn't exist" }] };
    }

    const valid = await argon2.verify(user.password, password);

    if (!valid) {
      return { errors: [{ field: 'password', message: 'incorrect password' }] };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
