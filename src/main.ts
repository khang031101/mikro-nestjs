import compression from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors();

  app.setGlobalPrefix('api');

  await app.register(fastifyCookie, { secret: process.env.COOKIE_SECRET });
  await app.register(compression, { encodings: ['gzip', 'deflate'] });
  await app.register(helmet);
  await app.register(fastifyCsrf);

  const config = new DocumentBuilder()
    .setTitle('App API')
    .setDescription('The app API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableShutdownHooks();

  await app.listen(8192, '0.0.0.0');
}

void bootstrap();
