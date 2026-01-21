import { setupCanvas, drawSegment } from "./canvas.js";
import { ws, send } from "./websocket.js";



const drawCanvas = document.getElementById("drawCanvas");
const overlayCanvas = document.getElementById("overlayCanvas");

const drawCtx = setupCanvas(drawCanvas);
const overlayCtx = setupCanvas(overlayCanvas);



const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const usersEl = document.getElementById("users");



const toolState = {
  mode: "brush",
  color: "#000000",
  size: 4
};

let wsReady = false;
let myUser = null;
let onlineUsers = [];

let drawing = false;
let lastPoint = null;
let currentStroke = null;

let strokes = [];
const cursors = {};



brushBtn.onclick = () => (toolState.mode = "brush");
eraserBtn.onclick = () => (toolState.mode = "eraser");
colorPicker.oninput = e => (toolState.color = e.target.value);
sizePicker.oninput = e => (toolState.size = Number(e.target.value));

undoBtn.onclick = () => !drawing && send("undo");
redoBtn.onclick = () => !drawing && send("redo");



function resizeCanvases() {
  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
}

resizeCanvases();
window.addEventListener("resize", resizeCanvases);



ws.onopen = () => (wsReady = true);

ws.onmessage = e => {
  const msg = JSON.parse(e.data);

  if (msg.type === "init") {
    strokes = msg.payload;
    redrawDrawLayer();
  }

  if (msg.type === "user:init") {
    myUser = msg.payload;
    toolState.color = myUser.color;
  }

  if (msg.type === "users:update") {
    onlineUsers = msg.payload;
    renderUserList();
  }

  if (msg.type === "cursor") {
    cursors[msg.payload.userId] = msg.payload;
    redrawOverlay();
  }

  if (msg.type === "draw") {
    drawSegment(drawCtx, msg.payload.from, msg.payload.to, msg.payload);
  }

  if (msg.type === "stroke:add") {
    strokes.push(msg.payload);
  }

  if (msg.type === "canvas:reset") {
    strokes = msg.payload;
    redrawDrawLayer();
  }
};



drawCanvas.addEventListener("mousedown", e => {
  drawing = true;

  const point = { x: e.offsetX, y: e.offsetY };
  lastPoint = point;

  currentStroke = {
    id: crypto.randomUUID(),
    tool: toolState.mode,
    color: toolState.color,
    width: toolState.size,
    points: [point]
  };
});

drawCanvas.addEventListener("mousemove", e => {
  
  if (myUser && wsReady) {
    cursors[myUser.id] = {
      userId: myUser.id,
      x: e.offsetX,
      y: e.offsetY,
      drawing,
      tool: toolState.mode,
      size: toolState.size,
      color: toolState.color
    };
    send("cursor", cursors[myUser.id]);
    redrawOverlay();
  }

  if (!drawing || !currentStroke) return;

  const currentPoint = { x: e.offsetX, y: e.offsetY };

  
  drawSegment(drawCtx, lastPoint, currentPoint, currentStroke);
  currentStroke.points.push(currentPoint);


  if (wsReady) {
    send("draw", {
      from: lastPoint,
      to: currentPoint,
      strokeId: currentStroke.id,
      tool: currentStroke.tool,
      color: currentStroke.color,
      width: currentStroke.width
    });
  }

  lastPoint = currentPoint;
});

drawCanvas.addEventListener("mouseup", finishStroke);
drawCanvas.addEventListener("mouseleave", finishStroke);

function finishStroke() {
  if (!currentStroke) return;

  strokes.push(currentStroke);
  if (wsReady) send("stroke:add", currentStroke);

  drawing = false;
  currentStroke = null;
  lastPoint = null;
}



function redrawDrawLayer() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i++) {
      drawSegment(drawCtx, stroke.points[i - 1], stroke.points[i], stroke);
    }
  }
}

function redrawOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  drawCursors();
}



function drawCursors() {
  Object.values(cursors).forEach(c => {
    if (!c) return;

    if (c.tool === "eraser") {
      overlayCtx.strokeStyle = "#000";
      overlayCtx.strokeRect(
        c.x - c.size / 2,
        c.y - c.size / 2,
        c.size,
        c.size
      );
    } else if (c.drawing) {
      overlayCtx.save();
      overlayCtx.translate(c.x, c.y);
      overlayCtx.rotate(-Math.PI / 4);
      overlayCtx.beginPath();
      overlayCtx.moveTo(0, 0);
      overlayCtx.lineTo(12, 0);
      overlayCtx.strokeStyle = c.color;
      overlayCtx.lineWidth = 2;
      overlayCtx.stroke();
      overlayCtx.restore();
    } else {
      overlayCtx.beginPath();
      overlayCtx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      overlayCtx.fillStyle = c.color;
      overlayCtx.fill();
    }
  });
}



function renderUserList() {
  usersEl.innerHTML = "";
  onlineUsers.forEach(u => {
    const div = document.createElement("div");
    div.textContent = u.id.slice(0, 5);
    div.style.color = u.color;
    usersEl.appendChild(div);
  });
}
