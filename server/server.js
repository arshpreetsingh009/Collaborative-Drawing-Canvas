const DrawingState = require("./drawing-state");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const drawingState = new DrawingState();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


app.use(express.static(path.join(__dirname, "../client")));

wss.on("connection", ws => {
  console.log("Client connected");

 
  ws.send(JSON.stringify({
    type: "init",
    payload: drawingState.snapshot()
  }));

  ws.on("message", msg => {
    const data = JSON.parse(msg.toString());

    switch (data.type) {
      case "stroke:add":
        drawingState.addStroke(data.payload);
        broadcast(ws, data);
        break;

      case "undo":
        drawingState.undo();
        broadcast(null, {
          type: "canvas:reset",
          payload: drawingState.snapshot()
        });
        break;

      case "redo":
        drawingState.redo();
        broadcast(null, {
          type: "canvas:reset",
          payload: drawingState.snapshot()
        });
        break;
    }
    wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (raw) => {
    let msg;

    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      console.error("Invalid JSON", err);
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

      case "undo": {
  const ok = drawingState.undo();

  
  if (!ok) return;

  broadcast(null, {
    type: "canvas:reset",
    payload: drawingState.snapshot()
  });
  break;}


    case "redo": {
  const ok = drawingState.redo();

  
  if (!ok) return;

  broadcast(null, {
    type: "canvas:reset",
    payload: drawingState.snapshot()
  });
  break;}





      default:
        console.warn("Unknown message type:", msg.type);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});


  });
});
function broadcast(sender, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(data);
    }
  });
}
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i++) {
      drawSegment(ctx, stroke.points[i - 1], stroke.points[i], stroke);
    }
  }
}


server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
