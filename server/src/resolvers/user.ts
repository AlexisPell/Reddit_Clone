import { Resolver, Mutation, Arg, Ctx, Field, ObjectType, Query } from 'type-graphql';
import { EntityManager } from '@mikro-orm/postgresql';
import argon2 from 'argon2';
import { v4 } from 'uuid';

import { UsernamePasswordInput } from './UsernamePasswordInput';
import { MyContext } from './../types';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX, FRONTEND_URL } from './../constants';
import { validateRegister } from './../utils/validateRegister';
import { sendEmail } from './../utils/sendEmail';

import { User } from './../entities/User';

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
  async me(@Ctx() { em, req }: MyContext): Promise<any> {
    if (!req.session.userId) {
      return null;
    }

    const me = await em.findOne(User, { id: req.session.userId });
    return me;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, em, req }: MyContext
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

    const user = await em.findOne(User, { id: parseInt(userId) });

    if (!user) {
      return {
        errors: [{ field: 'newPassword', message: "I'm sorry, user no longer exists..." }],
      };
    }

    // change password
    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    await em.persistAndFlush(user);

    await redis.del(key);

    // log in after changing password
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg('email') email: string, @Ctx() { em, redis }: MyContext) {
    const user = await em.findOne(User, { email });

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
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);

    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);

    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          email: options.email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      console.log('result', result);
      user = await result[0];

      // user = em.create(User, {
      //   username: options.username,
      //   email: options.email,
      //   password: hashedPassword,
      // });
      // em.persistAndFlush(user);
    } catch (e) {
      if (e.detail.includes('already exists') || e.code === '23505') {
        //duplicate username error
        return {
          errors: [
            { field: 'username', message: 'user with this username or email already exists' },
          ],
        };
      }
      console.log('message: ', e.message);
    }

    req.session.userId = user?.id;
    console.log('BACKEND USER', user);
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail }
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
