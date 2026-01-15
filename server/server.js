const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/**
 * 🔹 SERVE CLIENT FILES
 * This fixes CSP + file:// issues
 */
app.use(express.static(path.join(__dirname, "../client")));

wss.on("connection", ws => {
  console.log("✅ Client connected");

  ws.on("message", msg => {
    console.log("📩 Message:", msg.toString());
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
