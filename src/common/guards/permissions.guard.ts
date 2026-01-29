import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { EntityManager } from '@mikro-orm/core';
import { PERMISSION_KEY } from '../decorators/require-permissions.decorator';
import { Permission } from '../enums/permission.enum';
// import { User } from '@/entities/user.entity';
import { Member } from '@/entities/member.entity';
import { AuthRedisService } from '@/modules/auth/auth-redis.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly em: EntityManager,
    private readonly cls: ClsService,
    private readonly authRedis: AuthRedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const userId = this.cls.get('userId');
    const tenantId = this.cls.get('tenantId');
    const isAdmin = this.cls.get('isAdmin');

    if (!userId) {
      return false;
    }

    // Global Admin bypass
    if (isAdmin) {
      return true;
    }

    // Cache key includes tenantId for Slack-like multi-role support
    const cacheKey = tenantId ? `${userId}:${tenantId}` : userId;
    let permissions = await this.authRedis.getUserPermissions(cacheKey);

    if (!permissions) {
      if (tenantId) {
        // Slack-like: Check role in the specific tenant
        const member = await this.em.findOne(
          Member,
          { user: userId, tenantId },
          { populate: ['role'] as const },
        );
        permissions = (member?.role?.permissions ?? []) as string[];
      } else {
        // Fallback: Check global role if multi-tenancy is disabled
        // In a reusable template, we might check a global relationship here
        // const user = await this.em.findOne(User, { id: userId });
        // permissions = ... (if user has global role)
        permissions = [];
      }

      // Cache for 1 hour
      await this.authRedis.setUserPermissions(cacheKey, permissions, 3600);
    }

    const userPermissionsSet = new Set(permissions);

    const hasPermission = requiredPermissions.every(
      (perm) =>
        userPermissionsSet.has(perm) ||
        userPermissionsSet.has(Permission.ADMIN),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
