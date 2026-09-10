const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/boards', require('./routes/boardRoutes'));
app.use('/api/columns', require('./routes/columnRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running 🚀' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a board room
  socket.on('join-board', (boardId) => {
    socket.join(`board:${boardId}`);
    console.log(`👤 Socket ${socket.id} joined board:${boardId}`);
  });

  // Leave a board room
  socket.on('leave-board', (boardId) => {
    socket.leave(`board:${boardId}`);
    console.log(`👤 Socket ${socket.id} left board:${boardId}`);
  });

  // Broadcast board events
  socket.on('board-update', (data) => {
    socket.to(`board:${data.boardId}`).emit('board-updated', data);
  });

  socket.on('task-update', (data) => {
    socket.to(`board:${data.boardId}`).emit('task-updated', data);
  });

  socket.on('column-update', (data) => {
    socket.to(`board:${data.boardId}`).emit('column-updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Make io accessible in routes
app.set('io', io);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
