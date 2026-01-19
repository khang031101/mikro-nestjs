import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  DOCUMENTS_NAMESPACE,
  DOCUMENT_ACTION_LIST,
  DOCUMENT_EVENTS,
} from './document.gateway.constants';

@WebSocketGateway({ namespace: DOCUMENTS_NAMESPACE })
export class DocumentGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(DOCUMENT_EVENTS.SYNC)
  handleMessage(_client: unknown, _payload: unknown): string {
    void _client;
    void _payload;
    void DOCUMENT_ACTION_LIST;
    return 'Hello world!';
  }
}
