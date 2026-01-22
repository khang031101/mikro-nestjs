# Frontend Integration Guide: Real-time Whiteboard

This guide explains how to integrate the Real-time Whiteboard backend (NestJS + Yjs + Socket.IO) with a frontend application (e.g., React + Excalidraw).

## 1. Prerequisites

Install the necessary dependencies:

```bash
npm install yjs socket.io-client
# If using Excalidraw
npm install @excalidraw/excalidraw
```

## 2. Connection Details

- **Namespace**: `/whiteboards`
- **Transport**: Socket.IO (WebSocket)

## 3. Implementation Pattern

Since we are using Socket.IO instead of the standard `y-websocket`, you need a lightweight "adapter" to sync the Yjs document.

### Step-by-Step Logic

1.  **Initialize**: Create a `Y.Doc`.
2.  **Connect**: Connect Socket.IO to `/whiteboards`.
3.  **Join**: Emit `join` event with the `whiteboardId`.
4.  **Sync (Inbound)**:
    - On `sync` event: Apply the initial state from DB.
    - On `update` event: Apply incremental updates from other peers.
5.  **Sync (Outbound)**:
    - Listen to `doc.on('update', ...)`
    - Emit `update` event to server.
6.  **Cursors**:
    - Emit `cursor-update` to broadcast position.
    - Listen to `cursor-update` to show remote cursors.
    - Listen to `user-disconnected` to remove stopped cursors.

### Code Example (React/Generic)

Here is a complete helper class to manage the connection. You can use this in a `useEffect` hook.

```typescript
import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';

export class WhiteboardProvider {
  private doc: Y.Doc;
  private socket: Socket;
  private whiteboardId: string;

  constructor(whiteboardId: string, doc: Y.Doc, token: string) {
    this.whiteboardId = whiteboardId;
    this.doc = doc;

    // 1. Connect to the Namespace
    this.socket = io('http://localhost:3000/whiteboards', {
      auth: { token }, // Pass JWT if using auth
      transports: ['websocket'],
    });

    this.init();
  }

  private init() {
    this.socket.on('connect', () => {
      console.log('Connected to whiteboard server');

      // 2. Join the specific whiteboard room
      this.socket.emit('join', { whiteboardId: this.whiteboardId });
    });

    // 3. Handle Initial Sync (Load from DB)
    this.socket.on('sync', (state: Uint8Array) => {
      // Y.applyUpdate merges the remote state into the local doc
      Y.applyUpdate(this.doc, new Uint8Array(state));
    });

    // 4. Handle Real-time Updates from others
    this.socket.on('update', (update: Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update));
    });

    // 5. Send Local Updates to Server
    this.doc.on('update', (update: Uint8Array) => {
      // Emit the binary diff, origin check handled by caller usually or implicit
      this.socket.emit('update', {
        whiteboardId: this.whiteboardId,
        update: update,
      });
    });
  }

  public broadcastCursor(data: any) {
    this.socket.emit('cursor-update', {
      whiteboardId: this.whiteboardId,
      data,
    });
  }

  public onCursorUpdate(cb: (userId: string, data: any) => void) {
    this.socket.on('cursor-update', ({ userId, data }) => cb(userId, data));
    // Return cleanup function
    return () => this.socket.off('cursor-update');
  }

  public onUserDisconnect(cb: (userId: string) => void) {
    this.socket.on('user-disconnected', ({ userId }) => cb(userId));
    return () => this.socket.off('user-disconnected');
  }

  public disconnect() {
    this.socket.disconnect();
  }
}
```

## 4. Integrating with Excalidraw

Excalidraw does not natively support Yjs out of the box without a binding layer, but the standard approach is to store the **Excalidraw Element Array** inside a `Y.Array`.

You will likely need a library like `y-excalidraw` or manually sync the elements.

**Basic Data Structure approach:**

1.  Define a shared array in Yjs: `const yShapes = doc.getArray('shapes');`
2.  **On Excalidraw `onChange`**:
    - Calculate diff or just updating attributes of the Yjs types.
    - _Simpler MVP approach_: Serialize the whole scene to a single Y.Map key if conflicts aren't high, OR use the library bindings.

**Recommended for High Quality:**
Use `y-excalidraw` logic usually found in community examples, linking the `yDoc` to the Excalidraw `onChange` prop.
