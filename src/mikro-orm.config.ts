import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, UnderscoreNamingStrategy } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';

const env = process.env.NODE_ENV || 'development';

config({
  path: env !== 'development' ? `.env.${env}` : '.env',
});

export default defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
  dbName: process.env.DB_NAME || 'auth_db',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  debug: env === 'development' || env === 'test',
  highlighter: new SqlHighlighter(),
  namingStrategy: UnderscoreNamingStrategy,
  extensions: [Migrator, SeedManager],
  migrations: {
    path: 'dist/src/migrations',
    pathTs: 'src/migrations',
    fileName(timestamp, name) {
      return `${timestamp}${name ? '_' + name : ''}`;
    },
  },
  seeder: {
    path: 'dist/src/seeders',
    pathTs: 'src/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
  },
  logger(message) {
    if (env === 'test') {
      writeFileSync('mikro-orm.log', message + '\n', { flag: 'a' });
    } else {
      console.log(message);
    }
  },
});
