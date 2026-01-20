declare module 'socket.io-client' {
  export interface Socket {
    connected: boolean;
    emit(event: string, ...args: any[]): this;
    once(event: string, listener: (...args: any[]) => void): this;
    disconnect(): this;
  }

  export interface SocketOptions {
    transports?: string[];
    auth?: Record<string, string>;
  }

  export function io(uri: string, opts?: SocketOptions): Socket;
}
