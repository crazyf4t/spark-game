const { rooms } = require('./rooms');
const { ALL_QUESTIONS } = require('./questions');

function getRoom(code) {
  return rooms.get(code.toUpperCase());
}

function saveRoom(code, room) {
  rooms.set(code.toUpperCase(), room);
}

function handleSocketEvents(io, socket) {

  // Player joins room
  socket.on('join_room', async ({ code, name, role }) => {
    const room = getRoom(code);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (role === 'guest') {
      room.guest = name;
      room.state = 'playing';
      saveRoom(code, room);
      console.log(`Guest ${name} joined room ${code}`);
    }

    socket.join(code);
    socket.data = { code, name, role };

    // Notify the other player
    socket.to(code).emit('player_joined', { name, role });

    // Confirm join to this player
    socket.emit('joined', { room, role });
  });

  // Player rolls — advances question AND switches turn
  socket.on('roll', async () => {
    const { code } = socket.data;
    const room = getRoom(code);
    if (!room) return;

    // Advance to next question
    room.currentQuestion += 1;

    // Check if game over
    if (room.currentQuestion >= ALL_QUESTIONS.length) {
      saveRoom(code, room);
      io.to(code).emit('game_over', { winner: room.turn });
      return;
    }

    // Switch turn to the other player
    room.turn = room.turn === 'host' ? 'guest' : 'host';
    saveRoom(code, room);

    // Emit question to BOTH players
    const question = ALL_QUESTIONS[room.currentQuestion];
    io.to(code).emit('question_rolled', {
      question: question.text,
      round: question.round,
      roundKey: question.roundKey,
      index: room.currentQuestion,
      total: ALL_QUESTIONS.length
    });

    // Tell both players whose turn it now is
    io.to(code).emit('turn_changed', {
      turn: room.turn,
      nextQuestion: room.currentQuestion
    });
  });

  // Player ends game
  socket.on('end_game', async () => {
    const { code } = socket.data;
    if (!code) return;
    rooms.delete(code);
    io.to(code).emit('game_ended');
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.data?.code) {
      socket.to(socket.data.code).emit('partner_disconnected');
    }
  });
}

module.exports = { handleSocketEvents };