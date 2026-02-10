/**
 * Input Sanitization Middleware
 * Sanitizes user inputs to prevent XSS, SQL injection, and other attacks
 */

import validator from 'validator';
import { BadRequestError } from '../utils/errors.js';

/**
 * Sanitize string input
 * Only trims whitespace and removes null bytes
 * NOTE: Escape is handled by express-validator on specific fields
 */
export const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  // Only remove null bytes and control characters
  let sanitized = validator.stripLow(value);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req, res, next) => {
  console.log('🔍 Before sanitization:', JSON.stringify(req.body, null, 2));
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  console.log('✅ After sanitization:', JSON.stringify(req.body, null, 2));
  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Middleware to sanitize URL parameters
 */
export const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Combined sanitization middleware
 */
export const sanitizeAll = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new BadRequestError('Invalid email format');
  }
  
  const sanitized = validator.normalizeEmail(email.trim().toLowerCase());
  
  if (!validator.isEmail(sanitized)) {
    throw new BadRequestError('Invalid email format');
  }
  
  return sanitized;
};

/**
 * Validate and sanitize MongoDB ObjectId
 */
export const sanitizeMongoId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new BadRequestError('Invalid ID format');
  }
  
  const sanitized = id.trim();
  
  if (!validator.isMongoId(sanitized)) {
    throw new BadRequestError('Invalid ID format');
  }
  
  return sanitized;
};

/**
 * Sanitize and validate URL
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new BadRequestError('Invalid URL format');
  }
  
  const sanitized = url.trim();
  
  if (!validator.isURL(sanitized)) {
    throw new BadRequestError('Invalid URL format');
  }
  
  return sanitized;
};

/**
 * Prevent NoSQL injection by checking for special characters
 */
export const preventNoSQLInjection = (req, res, next) => {
  const checkForInjection = (obj, path = '') => {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }
    
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Only check for MongoDB operators in keys (most critical)
      if (key.startsWith('$')) {
        console.log(`🚨 NoSQL Injection detected at: ${currentPath}`);
        return true;
      }
      
      // Recursively check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkForInjection(obj[key], currentPath)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  console.log('🔐 Checking for NoSQL injection...');
  if (checkForInjection(req.body) || checkForInjection(req.query) || checkForInjection(req.params)) {
    console.log('🚨 NoSQL Injection attempt blocked!');
    throw new BadRequestError('Invalid characters detected in request');
  }
  console.log('✅ NoSQL injection check passed');
  
  next();
};

export default {
  sanitizeString,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  sanitizeEmail,
  sanitizeMongoId,
  sanitizeUrl,
  preventNoSQLInjection
};
