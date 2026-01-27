import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/postgresql';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { ClsModule } from 'nestjs-cls';
import { GlobalFilter } from './common/filters/global.filter';
import mikroOrmConfig from './mikro-orm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { WhiteboardsModule } from './modules/whiteboards/whiteboards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1000,
          limit: 100000,
        },
      ],
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
      interceptor: {
        mount: true,
        setup: (cls, context) => {
          const request = context.switchToHttp().getRequest<FastifyRequest>();

          const tenantId = request.headers?.['x-tenant-id'];
          if (tenantId) {
            cls.set(
              'tenantId',
              Array.isArray(tenantId) ? tenantId[0] : tenantId,
            );
          }
        },
      },
    }),
    AuthModule,
    UserModule,
    WhiteboardsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalFilter,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit() {}
}
