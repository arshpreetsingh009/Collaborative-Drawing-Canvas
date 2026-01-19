import { setupCanvas, drawSegment } from "./canvas.js";
import { ws, send } from "./websocket.js";

const canvas = document.getElementById("canvas");
const ctx = setupCanvas(canvas);


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

brushBtn.onclick = () => (toolState.mode = "brush");
eraserBtn.onclick = () => (toolState.mode = "eraser");
colorPicker.oninput = e => (toolState.color = e.target.value);
sizePicker.oninput = e => (toolState.size = Number(e.target.value));


let wsReady = false;
ws.onopen = () => {
  wsReady = true;
};


let myUser = null;
let onlineUsers = [];
const cursors = {};

let drawing = false;
let lastPoint = null;
let currentStroke = null;
let strokes = [];

undoBtn.onclick = () => {
  if (!drawing) send("undo");
};

redoBtn.onclick = () => {
  if (!drawing) send("redo");
};


function renderUserList() {
  usersEl.innerHTML = "";
  onlineUsers.forEach(u => {
    const div = document.createElement("div");
    div.textContent = u.id.slice(0, 5);
    div.style.color = u.color;
    usersEl.appendChild(div);
  });
}


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
  if (!wsReady || !myUser) return;

 
  send("cursor", {
    userId: myUser.id,
    x: e.offsetX,
    y: e.offsetY
  });

  if (!drawing || !currentStroke) return;

  const currentPoint = { x: e.offsetX, y: e.offsetY };

  drawSegment(ctx, lastPoint, currentPoint, currentStroke);
  currentStroke.points.push(currentPoint);

  send("draw", {
    from: lastPoint,
    to: currentPoint,
    strokeId: currentStroke.id,
    tool: currentStroke.tool,
    color: currentStroke.color,
    width: currentStroke.width
  });

  lastPoint = currentPoint;
});


canvas.addEventListener("mouseup", () => {
  if (!currentStroke) return;

  strokes.push(currentStroke);
  send("stroke:add", currentStroke);

  drawing = false;
  currentStroke = null;
  lastPoint = null;
});


canvas.addEventListener("mouseleave", () => {
  drawing = false;
  currentStroke = null;
  lastPoint = null;
});


window.addEventListener("keydown", e => {
  if (drawing) return;

  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    send("undo");
  }

  if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
    e.preventDefault();
    send("redo");
  }
});


ws.onmessage = e => {
  const msg = JSON.parse(e.data);

  if (msg.type === "init") {
    strokes = msg.payload;
    redraw();
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
  }

  if (msg.type === "draw") {
    drawSegment(ctx, msg.payload.from, msg.payload.to, msg.payload);
  }

  if (msg.type === "canvas:reset") {
    strokes = msg.payload;
    redraw();
  }
};


function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i++) {
      drawSegment(ctx, stroke.points[i - 1], stroke.points[i], stroke);
    }
  }

  drawing = false;
  currentStroke = null;
  lastPoint = null;
}
