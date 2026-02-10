/**
 * Main Server Entry Point
 * Starts HTTP server and initializes Socket.IO
 * Step 9 - Enhanced with structured logging
 */

import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/database.js';
import { initializeSocket } from './sockets/index.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Initialize Socket.IO handlers
initializeSocket(io);

// Make io accessible to routes via app.locals
app.locals.io = io;

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info('='.repeat(50));
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 API: http://localhost:${PORT}/api`);
  logger.info(`🔌 Socket.IO ready for connections`);
  logger.info('='.repeat(50));
});

// Handle server errors
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('Server error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    import('mongoose').then((mongoose) => {
      mongoose.default.connection.close(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

export { app, io };
