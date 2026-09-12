const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const path = require('path');
const fs = require('fs');

// Load environment variables based on mode
const isProduction =
  process.argv.includes('--production') ||
  process.env.NODE_ENV === 'production' ||
  process.env.npm_lifecycle_event === 'start';

const envFileName = isProduction ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, envFileName);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`⚙️  Loaded environment from ${envFileName}`);
} else {
  dotenv.config();
}

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'FluxBoard API',
    version: '1.0.0',
    status: 'online',
    message: 'FluxBoard Real-time Project Management API is running 🚀',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      boards: '/api/boards',
      columns: '/api/columns',
      tasks: '/api/tasks',
    },
  });
});

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
