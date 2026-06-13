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

// Routes
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
server.listen(PORT, async () => {
  await connectDB();
  console.log(`GameHub server running on port ${PORT}`);
});

module.exports = { io };