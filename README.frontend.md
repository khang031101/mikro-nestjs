# Frontend Integration Guide (Markdown + Yjs)

## Base URL

- REST base: `/api`
- Socket namespace: `/documents`

## Auth

- REST uses cookie `access_token`.
- Socket.IO connect uses JWT token in `auth.token` (preferred) or cookie `access_token`.

## REST APIs (Markdown)

### Get Markdown

`GET /api/documents/:id/markdown`

Response:

```json
{ "markdown": "# Title\n" }
```

### Set Markdown

`POST /api/documents/:id/markdown`

Request:

```json
{ "markdown": "# Title\n" }
```

Response:

```json
{ "markdown": "# Title\n" }
```

### Snapshot

- `GET /api/documents/:id/snapshot`
- `POST /api/documents/:id/snapshot`

Snapshot format (current):

```json
{
  "markdown": "# Title\n",
  "yjs": "base64-encoded-update",
  "updatedAt": "2026-01-20T10:00:00Z"
}
```

## Socket.IO Events

Connect:

```ts
const socket = io(`${baseUrl}/documents`, { auth: { token } });
```

### Client → Server

- `doc:join` `{ documentId, workspaceId }`
- `doc:update` `{ documentId, update }`

### Server → Client

- `doc:sync` `{ documentId, update }`
- `doc:update` `{ documentId, update }`
- `doc:error` `{ message }`

### Notes on `update`

- Binary Yjs update.
- If your transport cannot send `Uint8Array`, send `number[]` and convert back on client.

## Recommended Client Flow (Markdown)

1. Fetch Markdown via REST for initial view.
2. Connect Socket.IO and emit `doc:join`.
3. On `doc:sync`, apply update to Yjs doc.
4. On editor change, apply to Yjs doc and emit `doc:update`.
5. Optionally save Markdown to REST on demand (e.g., user action).

## Minimal Yjs Example (Client-side)

```ts
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const ytext = ydoc.getText('content');

ytext.observe(() => {
  const update = Y.encodeStateAsUpdate(ydoc);
  socket.emit('doc:update', { documentId, update: Array.from(update) });
});

socket.on('doc:sync', ({ update }) => {
  Y.applyUpdate(ydoc, new Uint8Array(update));
});
```
