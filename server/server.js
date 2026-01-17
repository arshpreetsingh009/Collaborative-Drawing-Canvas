const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const DrawingState = require("./drawing-state");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const drawingState = new DrawingState();

app.use(express.static(path.join(__dirname, "../client")));

function broadcast(sender, message) {
  const data = JSON.stringify(message);

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({
    type: "canvas:init",
    payload: drawingState.snapshot()
  }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "draw":
        broadcast(ws, msg);
        break;

      case "stroke:add":
        drawingState.addStroke(msg.payload);
        broadcast(ws, msg);
        break;

      case "undo":
        if (drawingState.strokes.length === 0) return;
        drawingState.undo();
        broadcast(null, {
          type: "canvas:reset",
          payload: drawingState.snapshot()
        });
        break;

      case "redo":
        if (drawingState.undone.length === 0) return;
        drawingState.redo();
        broadcast(null, {
          type: "canvas:reset",
          payload: drawingState.snapshot()
        });
        break;
    }
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
