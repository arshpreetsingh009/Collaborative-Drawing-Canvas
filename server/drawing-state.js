class DrawingState {
  constructor() {
    this.strokes = [];
    this.undone = [];
  }

  addStroke(stroke) {
    this.strokes.push(stroke);
    this.undone = [];
  }

  undo() {
    if (this.strokes.length === 0) return null;
    const s = this.strokes.pop();
    this.undone.push(s);
    return s;
  }

  snapshot() {
    return this.strokes;
  }
}

module.exports = DrawingState;
