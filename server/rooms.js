const express = require('express');
const router = express.Router();

// In-memory room storage (for development without Redis)
const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return chars[Math.floor(Math.random() * chars.length)];
}

// POST /rooms → create a new room
router.post('/', async (req, res) => {
  try {
    const { hostName } = req.body;
    let code;

    // Ensure unique code
    do { code = generateCode(); }
    while (rooms.has(code));

    const roomData = {
      host: hostName,
      guest: null,
      currentQuestion: 0,
      turn: 'host',
      state: 'waiting',
      createdAt: Date.now()
    };

    rooms.set(code, roomData);
    console.log(`Room created: ${code} by ${hostName}`);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms/:code → validate room exists
router.get('/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// DELETE /rooms/:code → delete room
router.delete('/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  rooms.delete(code);
  res.json({ success: true });
});

module.exports = router;
module.exports.rooms = rooms;