import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthHelper } from '../helpers/auth.helper';
import { faker } from '@faker-js/faker/locale/en_US';

describe('UserController (e2e)', () => {
  let app: NestFastifyApplication;
  let authHelper: AuthHelper;
  let authHeader: { cookie: string };

  beforeAll(async () => {
    app = global.testContext.app;
    authHelper = new AuthHelper();
    authHeader = await authHelper.getAuthHeader(faker.internet.email());
  });

  afterAll(async () => {
    await authHelper.clear();
  });

  describe('GET /users', () => {
    it('should be success', async () => {
      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: '/users',
        headers: authHeader,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.items).toBeDefined();
    });

    it('should be fail when not authenticated', async () => {
      const { statusCode } = await app.inject({
        method: 'GET',
        url: '/users',
      });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
