import 'reflect-metadata'; // And typegraphql And typeorm needs this one
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import session from 'express-session';
import cors from 'cors';
import { createConnection } from 'typeorm';

// dynamic imports
import { COOKIE_NAME, FRONTEND_URL, __prod__ } from './constants';
import { MyContext } from './types';
import { buildSchema } from 'type-graphql';

// import redis from 'redis';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';

// Resolvers
import { UserResolver } from './resolvers/user';
import { PostResolver } from './resolvers/post';
import { User } from './entities/User';
import { Post } from './entities/Post';

//Main func
const server = async () => {
  const app = express();

  await createConnection({
    type: 'postgres',
    database: 'lireddit2',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true, // allows forget about migration (manna from heaven)
    entities: [User, Post],
  });

  // create redis connection
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    })
  );

  // keep logged in via cookies
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
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
    context: ({ req, res }): MyContext => ({ req, res, redis }),
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
