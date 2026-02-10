/**
 * Global Error Handler Middleware
 * Centralized error handling with consistent format
 * Step 9.1 - Error Handling
 */

import { ApiError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Format validation errors
 */
const formatValidationError = (error) => {
  if (error instanceof ValidationError && error.errors) {
    return {
      success: false,
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors,
      timestamp: new Date().toISOString()
    };
  }
  return null;
};

/**
 * Format API errors
 */
const formatApiError = (error) => {
  return {
    success: false,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format MongoDB errors
 */
const formatMongoError = (error) => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      success: false,
      message: `${field} already exists`,
      statusCode: 409,
      timestamp: new Date().toISOString()
    };
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return {
      success: false,
      message: 'Validation failed',
      statusCode: 422,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return {
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
      statusCode: 400,
      timestamp: new Date().toISOString()
    };
  }

  return null;
};

/**
 * Format JWT errors
 */
const formatJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return {
      success: false,
      message: 'Invalid token',
      statusCode: 401,
      timestamp: new Date().toISOString()
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      success: false,
      message: 'Token expired',
      statusCode: 401,
      timestamp: new Date().toISOString()
    };
  }

  return null;
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id
    }
  });

  // Check if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Format error response based on error type
  let errorResponse;

  // 1. Validation errors (express-validator)
  errorResponse = formatValidationError(err);
  if (errorResponse) {
    return res.status(errorResponse.statusCode).json(errorResponse);
  }

  // 2. API errors (custom errors)
  if (err instanceof ApiError) {
    errorResponse = formatApiError(err);
    return res.status(errorResponse.statusCode).json(errorResponse);
  }

  // 3. MongoDB errors
  errorResponse = formatMongoError(err);
  if (errorResponse) {
    return res.status(errorResponse.statusCode).json(errorResponse);
  }

  // 4. JWT errors
  errorResponse = formatJWTError(err);
  if (errorResponse) {
    return res.status(errorResponse.statusCode).json(errorResponse);
  }

  // 5. Multer errors (file upload)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      statusCode: 400,
      timestamp: new Date().toISOString()
    });
  }

  // 6. Generic errors
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Development vs Production response
  const response = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = {
      name: err.name,
      message: err.message
    };
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper
 * Use this to wrap async route handlers to catch errors
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler
};
