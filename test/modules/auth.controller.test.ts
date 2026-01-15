import { faker } from '@faker-js/faker/locale/en_US';
import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthHelper } from '../helpers/auth.helper';
import { UserHelper } from '../helpers/user.helper';

describe('AuthController (e2e)', () => {
  let app: NestFastifyApplication;
  let userHelper: UserHelper;
  let authHelper: AuthHelper;

  beforeAll(() => {
    app = global.testContext.app;
    userHelper = new UserHelper();
    authHelper = new AuthHelper();
  });

  describe('POST /auth/sign-up', () => {
    afterEach(async () => {
      await userHelper.clearUsers();
    });

    it('should be success', async () => {
      const { statusCode, cookies, payload } = await app.inject({
        method: 'POST',
        url: '/auth/sign-up',
        payload: {
          email: faker.internet.email(),
          password: faker.internet.password(),
        },
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      expect(payload).toBeDefined();

      const token = cookies.find((cookie) =>
        cookie.name.startsWith('access_token'),
      );

      expect(token).toBeDefined();
    });

    it('should be fail when email is already used', async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      // First sign-up attempt
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/auth/sign-up',
        payload: { email, password },
      });
      expect(firstResponse.statusCode).toBe(HttpStatus.CREATED);

      // Second sign-up attempt with the same email
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/auth/sign-up',
        payload: { email, password },
      });
      expect(secondResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should be fail when payload is invalid', async () => {
      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/auth/sign-up',
        payload: {
          email: 'invalid-email',
          password: 'short',
        },
      });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/sign-in', () => {
    const email = faker.internet.email();
    const password = faker.internet.password();

    beforeAll(async () => {
      await userHelper.createUser(email, password);
    });

    afterAll(async () => {
      await userHelper.clearUsers();
    });

    it('should be success', async () => {
      const { statusCode, cookies, payload } = await app.inject({
        method: 'POST',
        url: '/auth/sign-in',
        payload: { email, password },
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      expect(payload).toBeDefined();
      const token = cookies.find((cookie) =>
        cookie.name.startsWith('access_token'),
      );

      expect(token).toBeDefined();
    });

    it('should be fail when credentials are invalid', async () => {
      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/auth/sign-in',
        payload: { email, password: 'wrongpassword' },
      });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should be fail when payload is invalid', async () => {
      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/auth/sign-in',
        payload: { email: 'invalid-email', password: '' },
      });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/sign-out', () => {
    let authHeader: { cookie: string };

    beforeAll(async () => {
      authHeader = await authHelper.getAuthHeader(faker.internet.email());
    });

    afterAll(async () => {
      await userHelper.clearUsers();
    });

    it('should be success', async () => {
      const { statusCode, cookies, payload } = await app.inject({
        method: 'POST',
        url: '/auth/sign-out',
        headers: authHeader,
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      expect(payload).toBeDefined();

      const clearedCookie = cookies.find((cookie) =>
        cookie.name.startsWith('access_token'),
      );

      expect(clearedCookie).toBeDefined();
      expect(clearedCookie!.value).toBe('');
    });

    it('should be fail when not authenticated', async () => {
      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/auth/sign-out',
      });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });
});
