export const DOCUMENTS_NAMESPACE = 'documents';

export const DOCUMENT_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN: 'doc:join',
  SYNC: 'doc:sync',
  UPDATE: 'doc:update',
  AWARENESS: 'doc:awareness',
  ERROR: 'doc:error',
} as const;

export const DOCUMENT_ACTION_LIST = [
  'Xác thực socket bằng JWT khi connect',
  'Join room theo documentId sau khi verify quyền',
  'Gửi state đầy đủ (Yjs) khi join',
  'Nhận update incremental và broadcast trong room',
  'Persist snapshot định kỳ hoặc khi disconnect',
  'Ghi log/metrics cơ bản cho kết nối và update',
] as const;
