/**
 * errorHandler.js — Global Error Handling Middleware
 * ────────────────────────────────────────────────────
 * Yeh middleware sab unhandled errors ko catch karta hai
 * aur clean JSON response deta hai
 */

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL unique violation (e.g. duplicate booking)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry — this record already exists.';
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference — related record does not exist.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please login again.';
  }

  logger.error(`[${req.method}] ${req.path} — ${statusCode}: ${err.stack || message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
