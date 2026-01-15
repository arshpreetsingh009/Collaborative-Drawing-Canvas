const DrawingState = require("./drawing-state");

const rooms = new Map();

function getRoom(roomId = "default") {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      state: new DrawingState(),
      clients: new Set()
    });
  }
  return rooms.get(roomId);
}

module.exports = { getRoom };
