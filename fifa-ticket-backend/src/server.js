/**
 * FIFA Ticket Booking & Seat Reservation System
 * -----------------------------------------------
 * Main Server Entry Point
 * Author: BSCS Group — UBIT, University of Karachi
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const logger = require('./utils/logger');

const { connectRedis } = require('./config/redisClient');
const { isUsingFakeDb } = require('./config/shardRouter');

const PORT = process.env.PORT || 5000;

// ─── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  try {
    // 1. Connect Redis before starting the server
    await connectRedis();
    
    // 2. Start listening for requests
    const server = app.listen(PORT, () => {
      logger.info(`🚀 FIFA Ticket Backend running on http://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      if (isUsingFakeDb()) {
        logger.info(`📦 Sharding Engine: Distributed Fake/In-Memory Shards Active [4 Regions]`);
      } else {
        logger.info(`📦 PostgreSQL Shards: Europe(5432) | Asia(5433) | NA(5434) | SA(5435)`);
      }
    });

    // ─── Graceful Shutdown ───────────────────────────────────────────
    process.on('SIGTERM', () => {
      logger.warn('SIGTERM received — shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error(`Unhandled Rejection at: ${promise} — reason: ${reason}`);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

