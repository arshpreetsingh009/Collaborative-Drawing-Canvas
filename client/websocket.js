export const ws = new WebSocket("ws://localhost:3000");

export function send(type, payload) {
  ws.send(JSON.stringify({ type, payload }));
}
5