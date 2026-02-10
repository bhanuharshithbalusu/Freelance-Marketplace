/**
 * HTTP Request Logger Middleware
 * Morgan-based HTTP request logging
 * Step 9.2 - Logging
 */

import morgan from 'morgan';
import logger from '../utils/logger.js';

// Define custom tokens
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

morgan.token('request-body', (req) => {
  // Don't log sensitive data
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitized = { ...req.body };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;
    
    return JSON.stringify(sanitized);
  }
  return '-';
});

// Development format - detailed, colorized
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - User: :user-id';

// Production format - JSON structured logging
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  contentLength: ':res[content-length]',
  userId: ':user-id',
  userAgent: ':user-agent',
  remoteAddr: ':remote-addr'
});

// Create middleware based on environment
const createRequestLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    // Development: colorized console output
    return morgan(developmentFormat, {
      stream: logger.stream
    });
  } else {
    // Production: JSON formatted
    return morgan(productionFormat, {
      stream: logger.stream,
      skip: (req, res) => {
        // Skip logging for health checks
        return req.url === '/api/health';
      }
    });
  }
};

// Custom detailed logger for specific routes
export const detailedLogger = morgan((tokens, req, res) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)} ms`,
    contentLength: tokens.res(req, res, 'content-length') || '0',
    userId: req.user?.id || 'anonymous',
    userAgent: tokens['user-agent'](req, res),
    ip: tokens['remote-addr'](req, res)
  };
  
  return JSON.stringify(log);
}, {
  stream: logger.stream
});

// Error logger - logs failed requests
export const errorLogger = morgan((tokens, req, res) => {
  // Only log errors (4xx and 5xx)
  const status = tokens.status(req, res);
  if (status && parseInt(status) < 400) {
    return null;
  }
  
  const log = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: status,
    responseTime: `${tokens['response-time'](req, res)} ms`,
    userId: req.user?.id || 'anonymous',
    ip: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res)
  };
  
  return JSON.stringify(log);
}, {
  stream: {
    write: (message) => {
      logger.error('HTTP Error', JSON.parse(message.trim()));
    }
  }
});

// Success logger - logs successful requests
export const successLogger = morgan((tokens, req, res) => {
  // Only log success (2xx)
  const status = tokens.status(req, res);
  if (status && (parseInt(status) < 200 || parseInt(status) >= 300)) {
    return null;
  }
  
  const log = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: status,
    responseTime: `${tokens['response-time'](req, res)} ms`,
    userId: req.user?.id || 'anonymous'
  };
  
  return JSON.stringify(log);
}, {
  stream: {
    write: (message) => {
      logger.info('HTTP Success', JSON.parse(message.trim()));
    }
  },
  skip: (req, res) => {
    // Skip health checks and static files
    return req.url === '/api/health' || req.url.startsWith('/static');
  }
});

export default createRequestLogger;
