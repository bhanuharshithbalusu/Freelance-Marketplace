/**
 * Express Application Configuration
 * Separates app configuration from server startup
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import rateLimit from 'express-rate-limit';
import { sanitizeAll, preventNoSQLInjection } from './middlewares/sanitization.js';
import createRequestLogger from './middlewares/requestLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import logger from './utils/logger.js';

// Middleware
const app = express();

// Log app startup
logger.info('Initializing Freelance Marketplace API...');

// Security middleware
app.use(helmet());

// HTTP Request Logging
app.use(createRequestLogger());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport for OAuth
app.use(passport.initialize());

// Global input sanitization and security
app.use(sanitizeAll);
app.use(preventNoSQLInjection);

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body ? Object.keys(req.body) : []
    });
    next();
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Freelance Marketplace API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API welcome route
app.get('/api', (req, res) => {
  logger.info('API root accessed');
  res.json({
    message: 'Welcome to Freelance Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      bids: '/api/bids',
      dashboard: '/api/dashboard',
      users: '/api/users (coming soon)',
      messages: '/api/messages (coming soon)'
    }
  });
});

// Import routes
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import bidRoutes from './routes/bid.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// API Routes - Order matters! More specific routes first
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes); // Must be before bidRoutes to avoid /:id conflict
app.use('/api/projects', projectRoutes);
app.use('/api/bids', bidRoutes); // Changed from /api to /api/bids for proper routing
app.use('/api', bidRoutes); // Also keep this for /api/projects/:id/bids routes
// app.use('/api/users', userRoutes);
// app.use('/api/messages', messageRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;
