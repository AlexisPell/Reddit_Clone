import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { MikroORM } from '@mikro-orm/core';
import microConfig from './mikro-orm.config';
import { __prod__ } from './constants';
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { buildSchema } from 'type-graphql';
import { MyContext } from './types';
import cors from 'cors';

// Resolvers
import { UserResolver } from './resolvers/user';
import { PostResolver } from './resolvers/post';

//Main func
const server = async () => {
  const app = express();

  // create db connection and update any db tables before any changes to it from outside
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  // create redis connection
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );

  // keep logged in via cookies
  app.use(
    session({
      name: 'qid',
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // cookie only in https
        sameSite: 'lax', //csrf
      },
      secret: 'alalallalalalalalala',
      resave: false, // must be changed together if so
      saveUninitialized: false, // must be changed together
    })
  );

  // create Apollo Server
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, PostResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  // add express to apollo
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log('Server running on 4000');
  });
};

server().catch((err) => {
  console.error(
    `----------------------------------------------------------------------------------------------------------
              <--- Handled errors: --->
----------------------------------------------------------------------------------------------------------
    `,
    err
  );
});