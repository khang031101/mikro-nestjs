import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { applyUpdate, Doc, encodeStateAsUpdate } from 'yjs';
import { Document } from '@/entities/document.entity';
import { WorkspaceMember } from '@/entities/workspace-member.entity';
import {
  DOCUMENTS_NAMESPACE,
  DOCUMENT_EVENTS,
  DOCUMENT_ROOM_PREFIX,
} from './document.gateway.constants';
import { DocumentService } from './document.service';

type YDocLike = object;

const encodeState = encodeStateAsUpdate as unknown as (
  doc: YDocLike,
) => Uint8Array;
const applyStateUpdate = applyUpdate as unknown as (
  doc: YDocLike,
  update: Uint8Array,
) => void;
const DocConstructor = Doc as unknown as { new (): YDocLike };

@WebSocketGateway({
  namespace: DOCUMENTS_NAMESPACE,
  cors: {
    origin: '*',
  },
})
export class DocumentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: DocumentServer;

  private readonly logger = new Logger(DocumentGateway.name);
  private readonly documents = new Map<string, YDocLike>();
  private readonly documentConnections = new Map<string, Set<string>>();
  private readonly persistTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly documentService: DocumentService,
    private readonly em: EntityManager,
  ) {}

  async handleConnection(client: DocumentSocket) {
    this.logger.debug(`connect socketId=${client.id}`);
    const user = await this.authenticate(client);
    if (!user) {
      this.logger.warn(`connect unauthorized socketId=${client.id}`);
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    client.data.user = user;
    this.logger.debug(`connect ok socketId=${client.id} userId=${user.userId}`);
  }

  async handleDisconnect(client: DocumentSocket) {
    this.logger.debug(`disconnect socketId=${client.id}`);
    for (const [
      documentId,
      connections,
    ] of this.documentConnections.entries()) {
      if (connections.delete(client.id) && connections.size === 0) {
        this.logger.debug(
          `persist on last disconnect documentId=${documentId}`,
        );
        await this.persistDocument(documentId);
        this.documentConnections.delete(documentId);
        this.documents.delete(documentId);
      }
    }
  }

  @SubscribeMessage(DOCUMENT_EVENTS.JOIN)
  async handleJoin(client: DocumentSocket, payload: DocumentJoinPayload) {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`join unauthorized socketId=${client.id}`);
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Unauthorized' });
      return;
    }

    if (!payload?.documentId || !payload?.workspaceId) {
      this.logger.warn(`join invalid payload socketId=${client.id}`);
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Invalid payload' });
      return;
    }

    this.logger.debug(
      `join request socketId=${client.id} userId=${user.userId} documentId=${payload.documentId} workspaceId=${payload.workspaceId}`,
    );

    const em = this.em.fork();

    const document = await em.findOne(Document, payload.documentId, {
      populate: ['workspace'],
      filters: false,
    });

    if (!document || document.workspace.id !== payload.workspaceId) {
      this.logger.warn(
        `join document not found socketId=${client.id} documentId=${payload.documentId}`,
      );
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Document not found' });
      return;
    }

    const member = await em.findOne(
      WorkspaceMember,
      {
        workspace: payload.workspaceId,
        user: user.userId,
        isActive: true,
      },
      {
        filters: false,
      },
    );

    if (!member) {
      this.logger.warn(
        `join forbidden socketId=${client.id} userId=${user.userId} workspaceId=${payload.workspaceId}`,
      );
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Forbidden' });
      return;
    }

    const room = this.getRoom(payload.documentId);
    await client.join(room);
    this.logger.debug(
      `join ok socketId=${client.id} documentId=${payload.documentId}`,
    );

    const doc = this.getOrCreateDoc(payload.documentId);
    const update = encodeState(doc);

    this.trackConnection(payload.documentId, client.id);
    this.trackDocumentForSocket(client, payload.documentId);

    client.emit(DOCUMENT_EVENTS.SYNC, {
      documentId: payload.documentId,
      update,
    } satisfies DocumentSyncPayload);
  }

  @SubscribeMessage(DOCUMENT_EVENTS.UPDATE)
  handleUpdate(client: DocumentSocket, payload: DocumentUpdatePayload) {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`update unauthorized socketId=${client.id}`);
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Unauthorized' });
      return;
    }

    if (!payload?.documentId || !payload?.update) {
      this.logger.warn(`update invalid payload socketId=${client.id}`);
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Invalid payload' });
      return;
    }

    if (!this.socketHasDocument(client, payload.documentId)) {
      this.logger.warn(
        `update not joined socketId=${client.id} documentId=${payload.documentId}`,
      );
      client.emit(DOCUMENT_EVENTS.ERROR, { message: 'Not joined' });
      return;
    }

    this.logger.debug(
      `update socketId=${client.id} userId=${user.userId} documentId=${payload.documentId}`,
    );

    const doc = this.getOrCreateDoc(payload.documentId);
    const update = toUint8Array(payload.update);
    applyStateUpdate(doc, update);

    const room = this.getRoom(payload.documentId);
    client.to(room).emit(DOCUMENT_EVENTS.UPDATE, {
      documentId: payload.documentId,
      update,
    } satisfies DocumentUpdatePayload);

    this.schedulePersist(payload.documentId);
  }

  private async authenticate(
    client: DocumentSocket,
  ): Promise<SocketUser | null> {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const authToken = auth?.token;
    const token =
      typeof authToken === 'string'
        ? authToken
        : this.extractTokenFromCookie(client.handshake.headers?.cookie);

    if (!token) {
      this.logger.warn(`auth missing token socketId=${client.id}`);
      return null;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        return null;
      }
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email?: string;
      }>(token, { secret });

      return { userId: payload.sub, email: payload.email };
    } catch (error) {
      this.logger.warn(
        `auth invalid token socketId=${client.id} error=${error instanceof Error ? error.message : 'unknown'}`,
      );
      return null;
    }
  }

  private extractTokenFromCookie(
    cookieHeader?: string | string[],
  ): string | undefined {
    if (!cookieHeader) {
      return undefined;
    }

    const headerValue = Array.isArray(cookieHeader)
      ? cookieHeader.join(';')
      : cookieHeader;

    const parts = headerValue.split(';');
    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'access_token') {
        return decodeURIComponent(value ?? '');
      }
    }

    return undefined;
  }

  private getRoom(documentId: string) {
    return `${DOCUMENT_ROOM_PREFIX}${documentId}`;
  }

  private getOrCreateDoc(documentId: string) {
    let doc = this.documents.get(documentId);
    if (!doc) {
      doc = new DocConstructor();
      this.documents.set(documentId, doc);
      this.logger.debug(`doc cache create documentId=${documentId}`);
    }
    return doc;
  }

  private trackConnection(documentId: string, socketId: string) {
    const connections = this.documentConnections.get(documentId) ?? new Set();
    connections.add(socketId);
    this.documentConnections.set(documentId, connections);
  }

  private trackDocumentForSocket(client: DocumentSocket, documentId: string) {
    const docs = client.data.documents ?? new Set();
    docs.add(documentId);
    client.data.documents = docs;
  }

  private socketHasDocument(client: DocumentSocket, documentId: string) {
    return client.data.documents?.has(documentId) ?? false;
  }

  private schedulePersist(documentId: string) {
    const existing = this.persistTimers.get(documentId);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      void this.persistDocument(documentId);
    }, 5000);

    timer.unref();

    this.persistTimers.set(documentId, timer);
  }

  private async persistDocument(documentId: string) {
    const doc = this.documents.get(documentId);
    if (!doc) {
      return;
    }

    const update = encodeState(doc);
    const snapshot = { yjs: Buffer.from(update).toString('base64') };

    try {
      await this.documentService.createSnapshot(documentId, snapshot);
      this.logger.debug(`persist ok documentId=${documentId}`);
    } catch (error) {
      this.logger.warn(
        `persist failed documentId=${documentId} error=${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}

interface DocumentJoinPayload {
  documentId: string;
  workspaceId: string;
}

interface DocumentSyncPayload {
  documentId: string;
  update: Uint8Array;
}

interface DocumentUpdatePayload {
  documentId: string;
  update: Uint8Array | Buffer | number[];
}

interface SocketUser {
  userId: string;
  email?: string;
}

interface DocumentSocketData {
  user?: SocketUser;
  documents?: Set<string>;
}

interface DocumentServerToClientEvents {
  [DOCUMENT_EVENTS.SYNC]: (payload: DocumentSyncPayload) => void;
  [DOCUMENT_EVENTS.UPDATE]: (payload: DocumentUpdatePayload) => void;
  [DOCUMENT_EVENTS.ERROR]: (payload: { message: string }) => void;
}

interface DocumentClientToServerEvents {
  [DOCUMENT_EVENTS.JOIN]: (payload: DocumentJoinPayload) => void;
  [DOCUMENT_EVENTS.UPDATE]: (payload: DocumentUpdatePayload) => void;
}

type DocumentServer = Server<
  DocumentServerToClientEvents,
  DocumentClientToServerEvents,
  Record<string, never>,
  DocumentSocketData
>;

type DocumentSocket = Socket<
  DocumentClientToServerEvents,
  DocumentServerToClientEvents,
  Record<string, never>,
  DocumentSocketData
>;

function toUint8Array(update: Uint8Array | Buffer | number[]) {
  if (update instanceof Uint8Array) {
    return update;
  }
  if (Array.isArray(update)) {
    return Uint8Array.from(update);
  }
  return new Uint8Array(update);
}
