/**
 * Rate Limiting Middleware
 * Prevents spam and abuse by limiting request rates
 */

import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../utils/errors.js';

/**
 * General API rate limiter
 * Applies to all API routes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    throw new TooManyRequestsError('Too many requests, please try again later.');
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 * DEVELOPMENT MODE: Generous limits for testing
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 200, // 200 attempts in dev, 10 in prod
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many authentication attempts. Please try again after 15 minutes.'
    );
  }
});

/**
 * Registration rate limiter
 * Prevents account creation spam
 * DEVELOPMENT MODE: Generous limits for testing
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 5 : 200, // 200 registrations in dev, 5 in prod
  message: 'Too many accounts created from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many accounts created from this IP. Please try again after an hour.'
    );
  }
});

/**
 * Bid submission rate limiter
 * Prevents bid spam on projects
 */
export const bidSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 bid submissions per minute
  message: 'You are submitting bids too quickly. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // Don't count failed requests
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'You are submitting bids too quickly. Please wait a moment before submitting again.'
    );
  }
});

/**
 * Bid update rate limiter
 * Prevents excessive bid updates
 */
export const bidUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 bid updates per 5 minutes
  message: 'You are updating bids too frequently. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'You are updating bids too frequently. Please try again later.'
    );
  }
});

/**
 * Project creation rate limiter
 * Prevents project spam
 * TESTING: Increased limits for development
 */
export const projectCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute (reduced from 1 hour for testing)
  max: 100, // Max 100 projects per minute (increased from 10/hour for testing)
  message: 'You are creating projects too quickly. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'You are creating projects too quickly. Please wait before creating another project.'
    );
  }
});

/**
 * Search/Query rate limiter
 * Prevents excessive database queries
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 searches per minute
  message: 'You are searching too frequently. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'You are searching too frequently. Please wait a moment.'
    );
  }
});

/**
 * File upload rate limiter
 * Prevents excessive file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 uploads per hour
  message: 'You are uploading files too frequently. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'You are uploading files too frequently. Please try again later.'
    );
  }
});

/**
 * Password reset rate limiter
 * Prevents abuse of password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset requests per hour
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new TooManyRequestsError(
      'Too many password reset attempts. Please try again after an hour.'
    );
  }
});

/**
 * Create a custom rate limiter with specific options
 */
export const createRateLimiter = (options) => {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new TooManyRequestsError(
        options.message || 'Too many requests. Please try again later.'
      );
    },
    ...options
  });
};

/**
 * Per-user rate limiter (requires authentication)
 * Limits based on user ID instead of IP
 */
export const createUserRateLimiter = (options) => {
  return rateLimit({
    ...options,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new TooManyRequestsError(
        options.message || 'Too many requests. Please try again later.'
      );
    }
  });
};

/**
 * Bid submission limiter per user
 * Prevents a single user from spamming bids
 */
export const userBidLimiter = createUserRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 bids per user per 5 minutes
  message: 'You are submitting too many bids. Please slow down.',
  skipFailedRequests: true
});

/**
 * Project creation limiter per user
 */
export const userProjectLimiter = createUserRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // Max 20 projects per user per day
  message: 'You have reached the daily limit for project creation.'
});

export default {
  generalLimiter,
  authLimiter,
  registerLimiter,
  bidSubmissionLimiter,
  bidUpdateLimiter,
  projectCreationLimiter,
  searchLimiter,
  uploadLimiter,
  passwordResetLimiter,
  createRateLimiter,
  createUserRateLimiter,
  userBidLimiter,
  userProjectLimiter
};
