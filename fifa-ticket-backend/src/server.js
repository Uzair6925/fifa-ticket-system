const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redisClient');
const { isUsingFakeDb } = require('./config/shardRouter');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectRedis();

    const server = app.listen(PORT, () => {
      logger.info(`FIFA Ticket Backend running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (isUsingFakeDb()) {
        logger.info('Database Mode: In-Memory Regional Clusters Active [4 Regions]');
      } else {
        logger.info('Database Mode: PostgreSQL Regional Clusters Active');
      }
    });

    process.on('SIGTERM', () => {
      logger.warn('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Rejection: ${reason}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
