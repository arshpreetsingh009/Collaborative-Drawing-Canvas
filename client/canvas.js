export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  return ctx;
}


export function drawBezier(ctx, p0, p1, p2, options) {
  ctx.save();

  ctx.globalCompositeOperation =
    options.tool === "eraser"
      ? "destination-out"
      : "source-over";

  ctx.strokeStyle = options.color;
  ctx.lineWidth = options.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(
    p1.x, p1.y,
    p1.x, p1.y,
    p2.x, p2.y
  );
  ctx.stroke();

  ctx.restore();
}

