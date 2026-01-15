import { setupCanvas, drawSegment } from "./canvas.js";

const canvas = document.getElementById("canvas");
const ctx = setupCanvas(canvas);

// UI elements
const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const colorPicker = document.getElementById("colorPicker");
const sizePicker = document.getElementById("sizePicker");

// 🔹 SINGLE SOURCE OF TRUTH
const toolState = {
  mode: "brush",          // "brush" | "eraser"
  color: "#000000",
  size: 4
};

// UI bindings
brushBtn.addEventListener("click", () => {
  toolState.mode = "brush";
});

eraserBtn.addEventListener("click", () => {
  toolState.mode = "eraser";
});

colorPicker.addEventListener("input", e => {
  toolState.color = e.target.value;
});

sizePicker.addEventListener("input", e => {
  toolState.size = Number(e.target.value);
});

// drawing state
let drawing = false;
let lastPoint = null;

// canvas events
canvas.addEventListener("mousedown", e => {
  drawing = true;
  lastPoint = { x: e.offsetX, y: e.offsetY };
});

canvas.addEventListener("mousemove", e => {
  if (!drawing) return;

  const currentPoint = { x: e.offsetX, y: e.offsetY };

  // 🔥 APPLY CURRENT TOOL STATE HERE
  drawSegment(ctx, lastPoint, currentPoint, {
    tool: toolState.mode,
    color: toolState.color,
    width: toolState.size
  });

  lastPoint = currentPoint;
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  lastPoint = null;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
  lastPoint = null;
});
