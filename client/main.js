import { setupCanvas, drawSegment } from "./canvas.js";
import { ws, send } from "./websocket.js";

const canvas = document.getElementById("canvas");
const ctx = setupCanvas(canvas);

// UI
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

undoBtn.addEventListener("click", () => {
  send("undo");
});

redoBtn.addEventListener("click", () => {
  send("redo");
});


// tool state
const toolState = {
  mode: "brush",
  color: "#000000",
  size: 4
};

brushBtn.onclick = () => (toolState.mode = "brush");
eraserBtn.onclick = () => (toolState.mode = "eraser");
colorPicker.oninput = e => (toolState.color = e.target.value);
sizePicker.oninput = e => (toolState.size = Number(e.target.value));

// websocket readiness
let wsReady = false;
ws.onopen = () => {
  wsReady = true;
  console.log("WebSocket connected");
};

// drawing state
let drawing = false;
let lastPoint = null;
let currentStroke = null;
let strokes = [];

// mouse events
canvas.addEventListener("mousedown", e => {
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

canvas.addEventListener("mousemove", e => {
  if (!drawing || !currentStroke) return;

  const currentPoint = { x: e.offsetX, y: e.offsetY };

  // draw locally
  drawSegment(ctx, lastPoint, currentPoint, currentStroke);

  // store stroke point
  currentStroke.points.push(currentPoint);

  // stream to others (real-time)
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

canvas.addEventListener("mouseup", () => {
  if (!currentStroke) return;

  strokes.push(currentStroke);

  if (wsReady) {
    send("stroke:add", currentStroke);
  }

  currentStroke = null;
  drawing = false;
  lastPoint = null;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
  currentStroke = null;
  lastPoint = null;
});

// undo / redo
window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    send("undo");
  }

  if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
    e.preventDefault();
    send("redo");
  }
});

// receive remote drawing
ws.onmessage = e => {
  const msg = JSON.parse(e.data);

  if (msg.type === "draw") {
    drawSegment(ctx, msg.payload.from, msg.payload.to, msg.payload);
  }

  if (msg.type === "canvas:reset") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = msg.payload;

    for (const stroke of strokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        drawSegment(ctx, stroke.points[i - 1], stroke.points[i], stroke);
      }
    }
  }
};
