import { User } from './entities/User';
import path from 'path';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';

// Entities
import { Post } from './entities/Post';

export default {
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  type: 'postgresql',
  dbName: 'lireddit',
  debug: !__prod__,
  user: 'postgres',
  password: 'postgres',
} as Parameters<typeof MikroORM.init>[0];

// To create migrations and fill a /migration folder -
// npx mikro-orm migration:create --run
// or
//npm run create:migration
