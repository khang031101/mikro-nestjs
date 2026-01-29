import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

declare module 'nestjs-cls' {
  interface ClsStore {
    userId?: string;
    tenantId?: string;
    isAdmin?: boolean;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors();

  app.setGlobalPrefix('api');

  await app.register(fastifyCookie, { secret: process.env.COOKIE_SECRET });
  await app.register(compression, { encodings: ['gzip', 'deflate'] });
  await app.register(helmet);
  await app.register(fastifyCsrf);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('App API')
    .setDescription('The app API description')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-tenant-id',
        in: 'header',
        description: 'Tenant ID for multi-tenant isolation',
      },
      'x-tenant-id',
    )
    .addSecurityRequirements('x-tenant-id')
    .addGlobalResponse({
      status: 500,
      description: 'Internal Server Error',
    })
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableShutdownHooks();

  await app.listen(8192, '0.0.0.0');
}

void bootstrap();
