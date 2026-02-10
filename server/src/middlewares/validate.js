/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Validate request and throw error if validation fails
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    // Debug logging
    console.log('🔴 Validation Errors:', JSON.stringify(errorMessages, null, 2));
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    throw new ValidationError('Validation failed', errorMessages);
  }
  
  next();
};

export default validate;
