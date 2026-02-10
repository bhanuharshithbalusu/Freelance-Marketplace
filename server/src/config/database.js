/**
 * Database Configuration
 * MongoDB connection setup
 * Step 9 - Enhanced with structured logging
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+
      // but keeping them for backwards compatibility
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`, {
      host: conn.connection.host,
      name: conn.connection.name,
      port: conn.connection.port
    });
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', {
        error: err.message,
        stack: err.stack
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Error connecting to MongoDB', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

export default connectDB;
