export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  return ctx;
}

export function drawSegment(ctx, p1, p2, options) {
  // ⚠️ CANVAS STATE MUST BE SET EVERY TIME
  ctx.globalCompositeOperation =
    options.tool === "eraser"
      ? "destination-out"
      : "source-over";

  ctx.strokeStyle = options.color;
  ctx.lineWidth = options.width;

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}
