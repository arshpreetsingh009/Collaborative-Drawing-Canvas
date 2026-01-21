export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  return ctx;
}

export function drawSegment(ctx, p1, p2, options) {
  ctx.save();

  ctx.globalCompositeOperation =
    options.tool === "eraser"
      ? "destination-out"
      : "source-over";

  ctx.strokeStyle = options.color;
  ctx.lineWidth = options.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
  ctx.stroke();

  ctx.restore();
}

