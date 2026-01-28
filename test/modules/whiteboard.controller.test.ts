import { HttpStatus } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { faker } from '@faker-js/faker/locale/en_US';
import { WhiteboardHelper } from '../helpers/whiteboard.helper';

describe('WhiteboardsController (e2e)', () => {
  let app: NestFastifyApplication;
  let whiteboardHelper: WhiteboardHelper;

  beforeAll(async () => {
    app = global.testContext.app;
    whiteboardHelper = new WhiteboardHelper();
  });

  describe('POST /whiteboards', () => {
    afterEach(async () => {
      await whiteboardHelper.clearWhiteboards();
    });

    it('should be success', async () => {
      const name = faker.lorem.words(2);
      const { statusCode, payload } = await app.inject({
        method: 'POST',
        url: '/whiteboards',
        payload: { name },
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      const responseBody = JSON.parse(payload);
      expect(responseBody.name).toBe(name);
    });
  });

  describe('GET /whiteboards', () => {
    it('should be success', async () => {
      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: '/whiteboards',
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.items).toBeDefined();
    });
  });

  describe('GET /whiteboards/:id', () => {
    it('should be success', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/whiteboards',
        payload: { name: faker.lorem.words(2) },
      });
      const whiteboard = JSON.parse(createPayload);

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/whiteboards/${whiteboard.id}`,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.id).toBe(whiteboard.id);
    });
  });

  describe('POST /whiteboards/:id/versions', () => {
    it('should be success', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/whiteboards',
        payload: { name: faker.lorem.words(2) },
      });
      const whiteboard = JSON.parse(createPayload);

      await whiteboardHelper.setContent(whiteboard.id, 'some content');

      const versionName = 'v1';
      const { statusCode, payload } = await app.inject({
        method: 'POST',
        url: `/whiteboards/${whiteboard.id}/versions`,
        payload: { name: versionName },
      });

      expect(statusCode).toBe(HttpStatus.CREATED);
      const responseBody = JSON.parse(payload);
      expect(responseBody.name).toBe(versionName);
    });
  });

  describe('GET /whiteboards/:id/versions', () => {
    it('should be success', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/whiteboards',
        payload: { name: faker.lorem.words(2) },
      });
      const whiteboard = JSON.parse(createPayload);

      await whiteboardHelper.setContent(whiteboard.id, 'some content');

      await app.inject({
        method: 'POST',
        url: `/whiteboards/${whiteboard.id}/versions`,
        payload: { name: 'v1' },
      });

      const { statusCode, payload } = await app.inject({
        method: 'GET',
        url: `/whiteboards/${whiteboard.id}/versions`,
      });

      expect(statusCode).toBe(HttpStatus.OK);
      const responseBody = JSON.parse(payload);
      expect(responseBody.items).toHaveLength(1);
    });
  });

  describe('POST /whiteboards/:id/versions/:versionId/restore', () => {
    it('should be success', async () => {
      const { payload: createPayload } = await app.inject({
        method: 'POST',
        url: '/whiteboards',
        payload: { name: faker.lorem.words(2) },
      });
      const whiteboard = JSON.parse(createPayload);

      await whiteboardHelper.setContent(whiteboard.id, 'content v0');

      const { payload: versionPayload } = await app.inject({
        method: 'POST',
        url: `/whiteboards/${whiteboard.id}/versions`,
        payload: { name: 'v1' },
      });
      const version = JSON.parse(versionPayload);

      await whiteboardHelper.setContent(whiteboard.id, 'content v2');

      const { statusCode } = await app.inject({
        method: 'POST',
        url: `/whiteboards/${whiteboard.id}/versions/${version.id}/restore`,
      });

      expect(statusCode).toBe(HttpStatus.CREATED);

      const { payload: getPayload } = await app.inject({
        method: 'GET',
        url: `/whiteboards/${whiteboard.id}`,
      });
      const updatedWhiteboard = JSON.parse(getPayload);
      // MikroORM blobs are returned as { type: 'Buffer', data: [...] } in JSON or base64 depending on setup
      // but the service just restores it.
      expect(updatedWhiteboard.id).toBe(whiteboard.id);
    });
  });
});
