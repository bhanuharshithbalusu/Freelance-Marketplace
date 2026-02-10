/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors automatically
 */

/**
 * Wraps async functions to catch errors and pass to next()
 * @param {Function} fn - Async function to wrap
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
