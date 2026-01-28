import { DatabaseSeeder } from '@/seeders/DatabaseSeeder';
import fastifyCookie from '@fastify/cookie';
import { MikroORM } from '@mikro-orm/postgresql';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { GlobalFilter } from '@/common/filters/global.filter';
import { APP_FILTER } from '@nestjs/core';

export interface ITestContext {
  app: NestFastifyApplication;
  module: TestingModule;
}

declare global {
  var testContext: ITestContext;
}

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
    providers: [
      {
        provide: APP_FILTER,
        useClass: GlobalFilter,
      },
    ],
  }).compile();

  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.register(fastifyCookie, { secret: process.env.COOKIE_SECRET });

  await app.init();

  await app.getHttpAdapter().getInstance().ready();

  const orm = app.get(MikroORM);

  await orm.schema.refreshDatabase();
  await orm.seeder.seed(DatabaseSeeder);

  global.testContext = {
    app,
    module,
  };
});

afterAll(async () => {
  if (global.testContext) {
    await global.testContext.app.close();
  }
});
