import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

export interface ITestContext {
  app: NestFastifyApplication;
  module: TestingModule;
}

declare global {
  var testContext: ITestContext;
}

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const testApp = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  testApp.useWebSocketAdapter(new IoAdapter(testApp));

  testApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await testApp.register(fastifyCookie, { secret: process.env.COOKIE_SECRET });

  await testApp.init();

  await testApp.getHttpAdapter().getInstance().ready();

  global.testContext = {
    app: testApp,
    module: moduleFixture,
  };
});

afterAll(async () => {
  if (global.testContext) {
    await global.testContext.app.close();
  }
});
