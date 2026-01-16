import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ClsServiceManager } from 'nestjs-cls';

interface AuthUserPayload {
  userId: string;
  email?: string;
}

export const CurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const cls = ClsServiceManager.getClsService();
    const clsUserId = cls?.get<string>('userId');
    if (clsUserId) {
      return clsUserId;
    }

    const request = ctx.switchToHttp().getRequest<
      FastifyRequest & {
        user?: AuthUserPayload;
      }
    >();
    return request.user?.userId;
  },
);
