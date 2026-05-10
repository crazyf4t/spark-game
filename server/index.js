const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const roomsRouter = require('./rooms');
const { handleSocketEvents } = require('./socket-handlers');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/rooms', roomsRouter);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  handleSocketEvents(io, socket);
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`⚡ SPARK server running on port ${PORT}`);
});

module.exports = { app, io };