import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthHelper } from '../helpers/auth.helper';
import { RoleHelper } from '../helpers/role.helper';
import { MemberHelper } from '../helpers/member.helper';
import { UserHelper } from '../helpers/user.helper';
import { Permission } from '@/common/enums/permission.enum';
import { faker } from '@faker-js/faker/locale/en_US';

describe('RolesController (e2e)', () => {
  let app: NestFastifyApplication;
  let authHelper: AuthHelper;
  let roleHelper: RoleHelper;
  let memberHelper: MemberHelper;
  let userHelper: UserHelper;
  let authHeader: { cookie: string };
  const tenantId = faker.string.uuid();

  beforeAll(async () => {
    app = global.testContext.app;
    authHelper = new AuthHelper();
    roleHelper = new RoleHelper();
    memberHelper = new MemberHelper();
    userHelper = new UserHelper();
    authHeader = await authHelper.getAuthHeader(faker.internet.email());
  });

  afterAll(async () => {
    await memberHelper.clearMembers();
    await roleHelper.clearRoles();
    await authHelper.clear();
  });

  describe('POST /roles', () => {
    it('should create a new role', async () => {
      const createDto = {
        name: 'Admin',
        permissions: [Permission.ADMIN],
      };

      const { statusCode, payload } = await app.inject({
        method: 'POST',
        url: '/roles',
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: createDto,
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      const responseBody = JSON.parse(payload);
      expect(responseBody.name).toBe(createDto.name);
      expect(responseBody.permissions).toEqual(createDto.permissions);
      expect(responseBody.tenantId).toBe(tenantId);
    });

    it('should fail when not authenticated', async () => {
      const createDto = {
        name: 'Admin',
        permissions: [Permission.ADMIN],
      };

      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/roles',
        headers: {
          'x-tenant-id': tenantId,
        },
        payload: createDto,
      });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /roles', () => {
    beforeAll(async () => {
      await roleHelper.createRole('Viewer', [Permission.USER_READ], tenantId);
      await roleHelper.createRole('Editor', [Permission.USER_WRITE], tenantId);
    });

    it('should return paginated roles', async () => {
      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: '/roles',
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.items).toBeDefined();
      expect(Array.isArray(responseBody.items)).toBe(true);
      expect(responseBody.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /roles/:id', () => {
    it('should return a role by id', async () => {
      const role = await roleHelper.createRole(
        'Manager',
        [Permission.USER_READ, Permission.USER_WRITE],
        tenantId,
      );

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/roles/${role.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.id).toBe(role.id);
      expect(responseBody.name).toBe('Manager');
    });

    it('should return 404 for non-existent role', async () => {
      const { statusCode } = await app.inject({
        method: 'GET',
        url: `/roles/${faker.string.uuid()}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /roles/:id', () => {
    it('should update a role', async () => {
      const role = await roleHelper.createRole(
        'Support',
        [Permission.USER_READ],
        tenantId,
      );

      const updateDto = {
        name: 'Support Lead',
        permissions: [Permission.USER_READ, Permission.USER_WRITE],
      };

      const { statusCode, payload } = await app.inject({
        method: 'PATCH',
        url: `/roles/${role.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: updateDto,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.name).toBe(updateDto.name);
      expect(responseBody.permissions).toEqual(updateDto.permissions);
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should delete a role', async () => {
      const role = await roleHelper.createRole(
        'Temporary',
        [Permission.USER_READ],
        tenantId,
      );

      const { statusCode, payload } = await app.inject({
        method: 'DELETE',
        url: `/roles/${role.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.message).toBeDefined();

      // Verify deletion
      const { statusCode: getStatus } = await app.inject({
        method: 'GET',
        url: `/roles/${role.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(getStatus).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('Non-admin permission checks', () => {
    it('should deny user without USER_READ permission', async () => {
      const email = faker.internet.email();
      const user = await userHelper.createUser(email, 'Test@1234', false);
      const role = await roleHelper.createRole(
        'Writer Only',
        [Permission.USER_WRITE],
        tenantId,
      );
      await memberHelper.createMember(user, role, tenantId);
      const nonAdminAuth = await authHelper.getAuthHeader(
        email,
        'Test@1234',
        false,
      );

      const { statusCode } = await app.inject({
        method: 'GET',
        url: '/roles',
        headers: {
          ...nonAdminAuth,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    it('should deny user without ADMIN permission to create role', async () => {
      const email = faker.internet.email();
      const user = await userHelper.createUser(email, 'Test@1234', false);
      const role = await roleHelper.createRole(
        'No Admin',
        [Permission.USER_READ],
        tenantId,
      );
      await memberHelper.createMember(user, role, tenantId);
      const nonAdminAuth = await authHelper.getAuthHeader(
        email,
        'Test@1234',
        false,
      );

      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/roles',
        headers: {
          ...nonAdminAuth,
          'x-tenant-id': tenantId,
        },
        payload: {
          name: 'Test Role',
          permissions: [Permission.USER_READ],
        },
      });

      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
