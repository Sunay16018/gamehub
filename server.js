const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { connectDB, closeDB } = require('./db');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const { setupSocketHandlers } = require('./socket/handlers');
const { setupGameRooms } = require('./socket/gamerooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes - BUNLAR STATIC'DEN SONRA OLMALI
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Socket.IO setup
setupSocketHandlers(io);
setupGameRooms(io);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler - EN SONDA
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closeDB();
  server.close(() => process.exit(0));
});
process.on('SIGINT', async () => {
  await closeDB();
  server.close(() => process.exit(0));
});

const PORT = process.env.PORT || 3000;

// DB bağlantısı BURADA başlamalı
async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`GameHub server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server start failed:', err);
    process.exit(1);
  }
}

startServer();

module.exports = { io };
