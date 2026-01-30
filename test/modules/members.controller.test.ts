import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthHelper } from '../helpers/auth.helper';
import { RoleHelper } from '../helpers/role.helper';
import { MemberHelper } from '../helpers/member.helper';
import { UserHelper } from '../helpers/user.helper';
import { Permission } from '@/common/enums/permission.enum';
import { faker } from '@faker-js/faker/locale/en_US';

describe('MembersController (e2e)', () => {
  let app: NestFastifyApplication;
  let authHelper: AuthHelper;
  let roleHelper: RoleHelper;
  let memberHelper: MemberHelper;
  let userHelper: UserHelper;
  let authHeader: { cookie: string };
  let tenantId: string;

  beforeAll(async () => {
    app = global.testContext.app;
    authHelper = new AuthHelper();
    roleHelper = new RoleHelper();
    memberHelper = new MemberHelper();
    userHelper = new UserHelper();
    authHeader = await authHelper.getAuthHeader(faker.internet.email());
    tenantId = faker.string.uuid();
  });

  afterAll(async () => {
    await memberHelper.clearMembers();
    await roleHelper.clearRoles();
    await authHelper.clear();
  });

  describe('POST /members', () => {
    it('should create a new member', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role = await roleHelper.createRole(
        'Developer',
        [Permission.USER_READ],
        tenantId,
      );

      const createDto = {
        userId: user.id,
        roleId: role.id,
        isActive: true,
      };

      const { statusCode, payload } = await app.inject({
        method: 'POST',
        url: '/members',
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: createDto,
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      const responseBody = JSON.parse(payload);
      expect(responseBody.tenantId).toBe(tenantId);
      expect(responseBody.isActive).toBe(true);
    });

    it('should fail when user not found', async () => {
      const role = await roleHelper.createRole(
        'Designer',
        [Permission.USER_READ],
        tenantId,
      );

      const createDto = {
        userId: faker.string.uuid(),
        roleId: role.id,
      };

      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/members',
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: createDto,
      });

      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('should fail when role not found', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );

      const createDto = {
        userId: user.id,
        roleId: faker.string.uuid(),
      };

      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/members',
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: createDto,
      });

      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /members', () => {
    beforeAll(async () => {
      const user1 = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const user2 = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role = await roleHelper.createRole(
        'Member',
        [Permission.USER_READ],
        tenantId,
      );

      await memberHelper.createMember(user1, role, tenantId);
      await memberHelper.createMember(user2, role, tenantId);
    });

    it('should return paginated members', async () => {
      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: '/members',
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

    it('should filter by userId', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role = await roleHelper.createRole(
        'Guest',
        [Permission.USER_READ],
        tenantId,
      );
      await memberHelper.createMember(user, role, tenantId);

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/members?userId=${user.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /members/:id', () => {
    it('should return a member by id', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role = await roleHelper.createRole(
        'Contributor',
        [Permission.USER_READ],
        tenantId,
      );
      const member = await memberHelper.createMember(user, role, tenantId);

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/members/${member.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.id).toBe(member.id);
      expect(responseBody.user).toBeDefined();
      expect(responseBody.role).toBeDefined();
    });
  });

  describe('PATCH /members/:id', () => {
    it('should update a member role', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role1 = await roleHelper.createRole(
        'Junior',
        [Permission.USER_READ],
        tenantId,
      );
      const role2 = await roleHelper.createRole(
        'Senior',
        [Permission.ADMIN],
        tenantId,
      );
      const member = await memberHelper.createMember(user, role1, tenantId);

      const updateDto = {
        roleId: role2.id,
      };

      const { statusCode, payload } = await app.inject({
        method: 'PATCH',
        url: `/members/${member.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: updateDto,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.role.id).toBe(role2.id);
    });

    it('should update member active status', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role = await roleHelper.createRole(
        'Standard',
        [Permission.USER_READ],
        tenantId,
      );
      const member = await memberHelper.createMember(user, role, tenantId);

      const updateDto = {
        isActive: false,
      };

      const { statusCode, payload } = await app.inject({
        method: 'PATCH',
        url: `/members/${member.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
        payload: updateDto,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.isActive).toBe(false);
    });
  });

  describe('DELETE /members/:id', () => {
    it('should remove a member', async () => {
      const user = await userHelper.createUser(
        faker.internet.email(),
        'Test@1234',
      );
      const role = await roleHelper.createRole(
        'Temporary',
        [Permission.USER_READ],
        tenantId,
      );
      const member = await memberHelper.createMember(user, role, tenantId);

      const { statusCode, payload } = await app.inject({
        method: 'DELETE',
        url: `/members/${member.id}`,
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
        url: `/members/${member.id}`,
        headers: {
          ...authHeader,
          'x-tenant-id': tenantId,
        },
      });

      expect(getStatus).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
