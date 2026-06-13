const { getDB } = require('../db');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (data) => {
      socket.username = data.username || 'Anonim';
      socket.userId = data.userId;
      socket.emit('joined', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = { setupSocketHandlers };