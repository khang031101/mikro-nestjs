import { faker } from '@faker-js/faker/locale/en_US';
import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AuthHelper } from '../helpers/auth.helper';
import { CardHelper } from '../helpers/card.helper';

describe('CardsController (e2e)', () => {
  let app: NestFastifyApplication;
  let authHelper: AuthHelper;
  let cardHelper: CardHelper;
  let authHeader: { cookie: string };

  beforeAll(async () => {
    app = global.testContext.app;
    cardHelper = new CardHelper();
    authHelper = new AuthHelper();
    authHeader = await authHelper.getAuthHeader(faker.internet.email());
  });

  afterAll(async () => {
    await authHelper.clear();
  });

  describe('POST /cards', () => {
    afterEach(async () => {
      await cardHelper.clearCards();
    });

    it('should be success', async () => {
      const slug = faker.lorem.slug();
      const displayName = faker.person.fullName();

      const { statusCode, payload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug,
          displayName,
          jobTitle: 'Software Engineer',
          links: [
            {
              label: 'Facebook',
              url: 'https://facebook.com/me',
              type: 'social',
              iconKey: 'facebook',
            },
          ],
        },
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      expect(payload).toBeDefined();

      const responseBody = JSON.parse(payload);
      expect(responseBody.slug).toBe(slug);
      expect(responseBody.displayName).toBe(displayName);
    });

    it('should be fail when not authenticated', async () => {
      const { statusCode } = await app.inject({
        method: 'POST',
        url: '/cards',
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /cards', () => {
    it('should be success', async () => {
      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: '/cards',
        headers: authHeader,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.items).toBeDefined();
    });
  });

  describe('GET /cards/slug/:slug', () => {
    it('should be success', async () => {
      const slug = faker.lorem.slug();
      await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug,
          displayName: faker.person.fullName(),
        },
      });

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/cards/slug/${slug}`,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.slug).toBe(slug);
    });

    it('should be fail when card not found', async () => {
      const { statusCode } = await app.inject({
        method: 'GET',
        url: '/cards/slug/non-existent-slug',
      });

      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /cards/:id', () => {
    it('should be success', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createResponse.payload);

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/cards/${card.id}`,
        headers: authHeader,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.id).toBe(card.id);
    });

    it('should fail when card not found', async () => {
      const { statusCode } = await app.inject({
        method: 'GET',
        url: `/cards/${faker.string.uuid()}`,
        headers: authHeader,
      });

      expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /cards/:id', () => {
    it('should be success', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createPayload);

      const newName = 'Updated Name';
      const { statusCode, payload } = await app.inject({
        method: 'PATCH',
        url: `/cards/${card.id}`,
        headers: authHeader,
        payload: {
          displayName: newName,
          isActive: true, // Pass this to avoid Object.assign issue if possible
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.displayName).toBe(newName);
    });

    it('should update links successfully', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createPayload);

      const { statusCode, payload } = await app.inject({
        method: 'PATCH',
        url: `/cards/${card.id}`,
        headers: authHeader,
        payload: {
          displayName: 'Updated Name',
          isActive: true,
          links: [
            {
              label: 'Twitter',
              url: 'https://twitter.com/me',
            },
          ],
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.links).toHaveLength(1);
      expect(responseBody.links[0].label).toBe('Twitter');
    });

    it('should be success when updating same slug', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createResponse.payload);

      const { statusCode } = await app.inject({
        method: 'PATCH',
        url: `/cards/${card.id}`,
        headers: authHeader,
        payload: {
          slug: card.slug,
          isActive: true,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('should be success when updating to new unique slug', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createResponse.payload);

      const newSlug = faker.lorem.slug() + '-unique';
      const { statusCode } = await app.inject({
        method: 'PATCH',
        url: `/cards/${card.id}`,
        headers: authHeader,
        payload: {
          slug: newSlug,
          isActive: true,
        },
      });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('should fail when slug is already taken', async () => {
      const slug = faker.lorem.slug();
      await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug,
          displayName: faker.person.fullName(),
        },
      });

      const { payload: secondCardPayload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const secondCard = JSON.parse(secondCardPayload);

      const { statusCode } = await app.inject({
        method: 'PATCH',
        url: `/cards/${secondCard.id}`,
        headers: authHeader,
        payload: {
          slug,
        },
      });

      expect(statusCode).toBe(HttpStatus.CONFLICT);
    });

    it('should fail when updating other user card', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createPayload);

      const otherUserHeader = await authHelper.getAuthHeader(
        faker.internet.email(),
      );

      const { statusCode } = await app.inject({
        method: 'PATCH',
        url: `/cards/${card.id}`,
        headers: otherUserHeader,
        payload: {
          displayName: 'Hacker',
        },
      });

      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /cards/:id', () => {
    it('should be success', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createPayload);

      const { statusCode } = await app.inject({
        method: 'DELETE',
        url: `/cards/${card.id}`,
        headers: authHeader,
      });

      expect(statusCode).toBe(HttpStatus.OK);

      const { statusCode: getStatusCode } = await app.inject({
        method: 'GET',
        url: `/cards/${card.id}`,
        headers: authHeader,
      });
      expect(getStatusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('should fail when deleting other user card', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/cards',
        headers: authHeader,
        payload: {
          slug: faker.lorem.slug(),
          displayName: faker.person.fullName(),
        },
      });
      const card = JSON.parse(createPayload);

      const otherUserHeader = await authHelper.getAuthHeader(
        faker.internet.email(),
      );

      const { statusCode } = await app.inject({
        method: 'DELETE',
        url: `/cards/${card.id}`,
        headers: otherUserHeader,
      });

      expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
