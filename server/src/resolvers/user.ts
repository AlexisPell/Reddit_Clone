import { Resolver, Mutation, Arg, Ctx, InputType, Field, ObjectType, Query } from 'type-graphql';
import { User } from './../entities/User';
import { MyContext } from './../types';
import argon2 from 'argon2';

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

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
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return { errors: [{ field: 'username', message: 'username is too short' }] };
    }
    if (options.password.length < 6) {
      return {
        errors: [{ field: 'password', message: 'password is too short. 6 chars at least' }],
      };
    }

    const hashedPassword = await argon2.hash(options.password);

    const user = em.create(User, { username: options.username, password: hashedPassword });

    try {
      await em.persistAndFlush(user);
    } catch (e) {
      if (e.code === '23505') {
        //duplicate username error
        return { errors: [{ field: 'username', message: 'this username already in use' }] };
      }
      console.log('message: ', e.message);
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });

    if (!user) {
      return { errors: [{ field: 'username', message: 'That username doesnot exist' }] };
    }

    const valid = await argon2.verify(user.password, options.password);

    if (!valid) {
      return { errors: [{ field: 'password', message: 'incorrect password' }] };
    }

    req.session.userId = user.id;

    return { user };
  }
}
