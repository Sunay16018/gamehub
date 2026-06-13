const { v4: uuidv4 } = require('uuid');

const rooms = new Map();

function setupGameRooms(io) {
  io.on('connection', (socket) => {

    socket.on('createRoom', (data) => {
      const roomId = uuidv4().slice(0, 8);
      const room = {
        id: roomId,
        gameId: data.gameId,
        host: socket.id,
        players: [{ id: socket.id, username: data.username, ready: false }],
        status: 'waiting',
        maxPlayers: data.maxPlayers || 4,
        createdAt: Date.now()
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('roomCreated', room);
    });

    socket.on('joinRoom', (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return socket.emit('error', { message: 'Oda bulunamadı' });
      if (room.players.length >= room.maxPlayers) return socket.emit('error', { message: 'Oda dolu' });
      if (room.status !== 'waiting') return socket.emit('error', { message: 'Oyun başladı' });

      room.players.push({ id: socket.id, username: data.username, ready: false });
      socket.join(data.roomId);
      io.to(data.roomId).emit('playerJoined', room);
    });

    socket.on('ready', (data) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (player) player.ready = true;
      io.to(data.roomId).emit('playerReady', { playerId: socket.id, ready: true });

      if (room.players.every(p => p.ready) && room.players.length >= 2) {
        room.status = 'playing';
        io.to(data.roomId).emit('gameStart', room);
      }
    });

    socket.on('gameAction', (data) => {
      socket.to(data.roomId).emit('gameAction', { ...data, playerId: socket.id });
    });

    socket.on('gameOver', (data) => {
      const room = rooms.get(data.roomId);
      if (room) {
        room.status = 'finished';
        io.to(data.roomId).emit('gameOver', data);
      }
    });

    socket.on('leaveRoom', (data) => {
      const room = rooms.get(data.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(data.roomId);
        } else {
          io.to(data.roomId).emit('playerLeft', { playerId: socket.id, room });
        }
      }
      socket.leave(data.roomId);
    });

    socket.on('chat', (data) => {
      io.to(data.roomId).emit('chat', {
        username: data.username,
        message: data.message,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      for (const [roomId, room] of rooms.entries()) {
        const idx = room.players.findIndex(p => p.id === socket.id);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('playerLeft', { playerId: socket.id, room });
          }
        }
      }
    });
  });
}

module.exports = { setupGameRooms };