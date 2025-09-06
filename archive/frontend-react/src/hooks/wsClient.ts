export function createWebSocket(roomId: string): WebSocket {
  return new WebSocket(`ws://localhost:8080/ws/?room=${roomId}`);
}
