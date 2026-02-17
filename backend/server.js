const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// Make io accessible throughout the app
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join user-specific room for notifications
    socket.on('join-user', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their notification room`);
    });

    // Join project room for live bid updates
    socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`Socket ${socket.id} joined project-${projectId}`);
    });

    // Leave project room
    socket.on('leave-project', (projectId) => {
        socket.leave(`project-${projectId}`);
        console.log(`Socket ${socket.id} left project-${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
