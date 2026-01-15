# Copilot / AI Agent Instructions

Purpose: Help an AI coding agent become productive quickly in this repository.

Quick summary
- App: a small collaborative drawing app (static client + Node server + WebSocket).
- Server: `server/server.js` uses Express to serve `client/` and `ws` for realtime.
- Rooms & state: `server/room.js` defines `getRoom()` and `server/drawing-state.js` stores strokes and undo stacks.
- Client: `client/main.js`, `client/canvas.js`, and `client/websocket.js` implement UI, drawing primitives, and a simple WebSocket helper.

What to look for first
- Read [server/server.js](server/server.js) to see how the server accepts connections (listen port 3000) and currently logs messages — there is no room broadcasting wired there yet.
- Inspect [server/room.js](server/room.js) and [server/drawing-state.js](server/drawing-state.js) for the intended room/state model.
- Open [client/websocket.js](client/websocket.js) to see the message envelope: `ws.send(JSON.stringify({ type, payload }))` and the client WebSocket URL `ws://localhost:3000`.
- Check [client/main.js](client/main.js) and [client/canvas.js](client/canvas.js) for drawing conventions: single tool state object, continuous segments sent locally, and explicit reset of `globalCompositeOperation` on every draw.

Data flow & integration points (concrete)
- Client → Server: JSON messages of shape `{ type, payload }` sent via `send()` in `client/websocket.js`.
- Server behavior: currently `server/server.js` logs raw messages; adding real-time sync should: parse JSON, use `getRoom(roomId)` from `server/room.js`, update `DrawingState` and broadcast to other clients in the room.
- State model: `DrawingState` exposes `.addStroke(stroke)`, `.undo()`, and `.snapshot()` — use these when implementing server-side reconciliation or initial sync.

Project-specific patterns and conventions
- Single source of truth for tools: `tool` object in `client/main.js` (type, color, size). Prefer updating that object rather than spreading tool state across handlers.
- Canvas drawing: `drawSegment(ctx, from, to, tool)` must reset `ctx.globalCompositeOperation` each call — do not rely on previously set canvas state.
- Undo model: client currently does not send undo events; server state has an `undone` stack — if adding undo over network, keep server authoritative.

Dev & run commands
- Start server: `npm start` (runs `node server/server.js`).
- Dev with auto-reload: `npm run dev` (uses `nodemon server/server.js`).
- Server binds to port 3000 by default; client code connects to `ws://localhost:3000`.

When modifying behavior
- If you add broadcasting: update `wss.on('connection', ws => { ... })` in `server/server.js` to register clients with a room and forward typed messages to other clients.
- Keep message envelope `{ type, payload }` consistent; examples: `send('stroke', stroke)` or `send('undo', { userId })`.

Files to inspect for examples
- [server/server.js](server/server.js)
- [server/room.js](server/room.js)
- [server/drawing-state.js](server/drawing-state.js)
- [client/main.js](client/main.js)
- [client/canvas.js](client/canvas.js)
- [client/websocket.js](client/websocket.js)

Notes & open questions for the maintainer
- `room.js` is present but not wired into `server/server.js`; confirm intended runtime behavior for rooms and multi-room support.
- There is no persisted state or authentication; if adding either, decide whether to keep `DrawingState` in-memory or persist snapshots to disk/DB.

If anything is unclear, point me to the specific behavior you expect (room model, broadcast rules, message types) and I will update these instructions or implement the missing wiring.
