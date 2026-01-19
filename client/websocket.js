const protocol = location.protocol === "https:" ? "wss" : "ws";

export const ws = new WebSocket(`${protocol}://${location.host}`);

export function send(type, payload) {
  ws.send(JSON.stringify({ type, payload }));
}
