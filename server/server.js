const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const crypto = require("crypto");
const DrawingState = require("./drawing-state");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const drawingState = new DrawingState();
const users = new Map();

function randomColor() {
  return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

app.use(express.static(path.join(__dirname, "../client")));

function broadcast(sender, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(data);
    }
  });
}

function broadcastUsers() {
  broadcast(null, {
    type: "users:update",
    payload: Array.from(users.values())
  });
}

wss.on("connection", ws => {
  console.log("🔌 Client connected");

 
  const user = {
    id: crypto.randomUUID(),
    color: randomColor()
  };

  users.set(ws, user);


  ws.send(JSON.stringify({
    type: "user:init",
    payload: user
  }));

  
  ws.send(JSON.stringify({
    type: "init",
    payload: drawingState.snapshot()
  }));

  
  broadcastUsers();

  ws.on("message", raw => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case "cursor":
        if (!msg.payload) return;
        broadcast(ws, msg);
        break;

      case "draw":
        if (!msg.payload) return;
        broadcast(ws, msg);
        break;

      case "stroke:add":
        if (!msg.payload?.points) return;
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

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    users.delete(ws);
    broadcastUsers();
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
