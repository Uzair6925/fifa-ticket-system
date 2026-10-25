/**
 * logger.js — Winston Logger Utility
 * ────────────────────────────────────
 * Console + file logging for production debugging
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console output (colorized in dev)
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // File logging for errors
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // All logs
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;
