import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as Y from 'yjs';
import { WhiteboardsService } from './whiteboards.service';

@WebSocketGateway({
  namespace: 'whiteboards',
  cors: {
    origin: '*',
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50MB
})
export class WhiteboardsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WhiteboardsGateway.name);
  private readonly docs = new Map<string, Y.Doc>();
  private readonly saveTimers = new Map<string, NodeJS.Timeout>();
  private readonly socketParams = new Map<string, string>(); // socketId -> whiteboardId

  // Configurable debounce time in ms
  private readonly DEBOUNCE_MS = 2000;

  constructor(private readonly whiteboardsService: WhiteboardsService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
    // You can add auth check here if needed (e.g. validating token from handshake)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    const whiteboardId = this.socketParams.get(client.id);
    if (whiteboardId) {
      this.server
        .to(whiteboardId)
        .emit('user-disconnected', { userId: client.id });
      this.socketParams.delete(client.id);
    }
  }

  @SubscribeMessage('cursor-update')
  handleCursorUpdate(
    @MessageBody()
    data: { whiteboardId: string; data: Record<string, unknown> },
    @ConnectedSocket() client: Socket,
  ) {
    const { whiteboardId, data: payload } = data;
    // Broadcast cursor to other clients in the room
    client.to(whiteboardId).emit('cursor-update', {
      userId: client.id,
      data: payload,
    });
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { whiteboardId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { whiteboardId } = data;
    this.logger.debug(`Client ${client.id} joining whiteboard ${whiteboardId}`);

    await client.join(whiteboardId);
    this.socketParams.set(client.id, whiteboardId);

    // Load or create Y.Doc for this whiteboard
    let doc = this.docs.get(whiteboardId);
    if (!doc) {
      doc = new Y.Doc();
      this.docs.set(whiteboardId, doc);

      // Try to load existing content from DB
      try {
        const whiteboard =
          await this.whiteboardsService.findOneForGateway(whiteboardId);
        if (whiteboard.content) {
          Y.applyUpdate(doc, new Uint8Array(whiteboard.content));
          this.logger.debug(
            `Loaded content for whiteboard ${whiteboardId} from DB`,
          );
        }
      } catch (error) {
        this.logger.error(`Error loading whiteboard ${whiteboardId}: ${error}`);
      }
    }

    // Send current state to the joining client
    const state = Y.encodeStateAsUpdate(doc);
    // Convert Uint8Array to regular array or Buffer-like object for transport if necessary,
    // but Socket.IO handles binary well.
    client.emit('sync', state);
  }

  @SubscribeMessage('update')
  handleUpdate(
    @MessageBody() data: { whiteboardId: string; update: Uint8Array },
    @ConnectedSocket() client: Socket,
  ) {
    const { whiteboardId, update } = data;
    this.logger.debug(
      `Received update for whiteboard ${whiteboardId} from ${client.id}`,
    );

    const doc = this.docs.get(whiteboardId);
    if (!doc) {
      // If doc is missing from memory, we might need to reload it.
      // For now, ignore updates to non-loaded docs or force a reload logic.
      this.logger.warn(
        `Received update for unloaded whiteboard ${whiteboardId}`,
      );
      return;
    }

    // Apply update to in-memory doc
    try {
      Y.applyUpdate(doc, new Uint8Array(update));

      // Broadcast update to other clients in the room (excluding sender if needed, but usually we just broadcast to others)
      client.to(whiteboardId).emit('update', update);

      // Schedule debounce save
      this.scheduleSave(whiteboardId, doc);
    } catch (e) {
      this.logger.error(`Failed to apply update: ${e}`);
    }
  }

  private scheduleSave(whiteboardId: string, doc: Y.Doc) {
    if (this.saveTimers.has(whiteboardId)) {
      clearTimeout(this.saveTimers.get(whiteboardId));
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timer = setTimeout(async () => {
      this.logger.debug(`Saving whiteboard ${whiteboardId} to DB...`);
      const content = Y.encodeStateAsUpdate(doc);
      try {
        // Convert Uint8Array to Buffer for MikroORM
        await this.whiteboardsService.updateContent(
          whiteboardId,
          Buffer.from(content),
        );
        this.logger.debug(`Saved whiteboard ${whiteboardId}`);
      } catch (error) {
        this.logger.error(
          `Failed to save whiteboard ${whiteboardId}: ${error}`,
        );
      }
      this.saveTimers.delete(whiteboardId);
    }, this.DEBOUNCE_MS);

    this.saveTimers.set(whiteboardId, timer);
  }
}
