import { faker } from '@faker-js/faker/locale/en_US';
import { HttpStatus } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { io as rawIo } from 'socket.io-client';
import { AuthHelper } from '../../helpers/auth.helper';
import { UserHelper } from '../../helpers/user.helper';

describe('DocumentGateway (e2e)', () => {
  const TEST_TIMEOUT = 10000;
  let app: NestFastifyApplication;
  let authHelper: AuthHelper;
  let userHelper: UserHelper;
  let baseUrl: string;
  let token: string;
  let workspaceId: string;
  let documentId: string;

  beforeAll(() => {
    jest.setTimeout(TEST_TIMEOUT);
  });

  beforeAll(async () => {
    app = global.testContext.app;
    authHelper = new AuthHelper();
    userHelper = new UserHelper();

    const address = await ensureListen(app);
    baseUrl = address.replace(/\/$/, '');

    const authHeader = await authHelper.getAuthHeader(faker.internet.email());
    token = authHeader.cookie.split('=')[1];

    const workspaceResponse = await app.inject({
      method: 'POST',
      url: '/workspaces',
      headers: authHeader,
      payload: { name: faker.company.name() },
    });

    expect(workspaceResponse.statusCode).toBe(HttpStatus.CREATED);
    const workspacePayload = parseJson(workspaceResponse.payload);
    workspaceId = extractId(workspacePayload, workspaceResponse.payload);

    const documentResponse = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspaceId}/documents`,
      headers: authHeader,
      payload: { title: faker.lorem.words(3) },
    });

    expect(documentResponse.statusCode).toBe(HttpStatus.CREATED);
    const documentPayload = parseJson(documentResponse.payload);
    documentId = extractId(documentPayload, documentResponse.payload);
  });

  afterAll(async () => {
    await userHelper.clearUsers();
  });

  it(
    'should sync and broadcast updates',
    async () => {
      const clientA = createClient(baseUrl, token);
      const clientB = createClient(baseUrl, token);
      try {
        await waitForConnect(clientA, TEST_TIMEOUT);
        await waitForConnect(clientB, TEST_TIMEOUT);

        clientA.emit('doc:join', { documentId, workspaceId });
        clientB.emit('doc:join', { documentId, workspaceId });

        const syncA = await waitForEvent<DocumentSyncPayload>(
          clientA,
          'doc:sync',
          TEST_TIMEOUT,
        );
        const syncB = await waitForEvent<DocumentSyncPayload>(
          clientB,
          'doc:sync',
          TEST_TIMEOUT,
        );

        expect(syncA.documentId).toBe(documentId);
        expect(syncB.documentId).toBe(documentId);

        const update = syncA.update;

        clientA.emit('doc:update', {
          documentId,
          update: normalizeUpdate(update),
        } satisfies DocumentUpdatePayload);

        const updateB = await waitForEvent<DocumentUpdatePayload>(
          clientB,
          'doc:update',
          TEST_TIMEOUT,
        );

        expect(updateB.documentId).toBe(documentId);
        expect(updateB.update).toBeDefined();
      } finally {
        clientA.disconnect();
        clientB.disconnect();
      }
    },
    TEST_TIMEOUT,
  );
});

function createClient(baseUrl: string, token: string): ClientSocket {
  const ioClient = rawIo as IoFunction;
  return ioClient(`${baseUrl}/documents`, {
    auth: { token },
    transports: ['websocket'],
    timeout: 5000,
    reconnection: false,
    forceNew: true,
  });
}

function onceEvent<T>(client: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    client.once(event, (payload: T) => resolve(payload));
  });
}

function waitForEvent<T>(
  client: ClientSocket,
  event: string,
  timeoutMs: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeoutMs);

    client.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function waitForConnect(
  client: ClientSocket,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for connect'));
    }, timeoutMs);

    client.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });

    client.once('connect_error', (error) => {
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error('connect_error'));
    });
  });
}

async function ensureListen(app: NestFastifyApplication): Promise<string> {
  const fastify = app.getHttpAdapter().getInstance();
  if (!fastify.server.listening) {
    await app.listen(0, '127.0.0.1');
  }

  const address = fastify.server.address();
  if (typeof address === 'string') {
    return address;
  }

  return `http://127.0.0.1:${address?.port ?? 0}`;
}

function parseJson(payload: string): unknown {
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return undefined;
  }
}

function extractId(payload: unknown, rawPayload?: string): string {
  if (typeof payload === 'string') {
    return payload;
  }
  if (rawPayload && rawPayload.startsWith('"')) {
    try {
      const parsed = JSON.parse(rawPayload) as unknown;
      if (typeof parsed === 'string') {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  if (payload && typeof payload === 'object' && 'id' in payload) {
    const value = (payload as { id?: unknown }).id;
    if (typeof value === 'string') {
      return value;
    }
  }
  throw new Error('Invalid response payload');
}

function normalizeUpdate(update: Uint8Array | number[]): number[] {
  return Array.isArray(update) ? update : Array.from(update);
}

interface DocumentSyncPayload {
  documentId: string;
  update: Uint8Array | number[];
}

interface DocumentUpdatePayload {
  documentId: string;
  update: Uint8Array | Buffer | number[];
}

type ClientSocket = {
  emit: (event: string, payload?: unknown) => void;
  once: (event: string, listener: (payload: unknown) => void) => void;
  disconnect: () => void;
};

type IoFunction = (
  uri: string,
  opts?: {
    auth?: { token: string };
    transports?: string[];
    timeout?: number;
    reconnection?: boolean;
    forceNew?: boolean;
  },
) => ClientSocket;
