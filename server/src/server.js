import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/database.js';
import config from './config/index.js';
import logger from './shared/utils/logger.js';
import { checkAndExpireRequests } from './shared/utils/autoAssign.js';
import cacheService from './shared/utils/cache.js';

const PORT = config.server.port;

let server;

const startBackgroundJobs = () => {
  const EXPIRY_CHECK_INTERVAL = 60 * 1000;
  
  setInterval(async () => {
    try {
      const result = await checkAndExpireRequests();
      if (result.expiredCount > 0 || result.reattemptCount > 0) {
        logger.info('Background job: Request expiry check', result);
      }
    } catch (error) {
      logger.error('Background job error:', error);
    }
  }, EXPIRY_CHECK_INTERVAL);
  
  logger.info('Background jobs started (request expiry check every 60s)');
};

const startServer = async () => {
  try {
    await connectDB();
    await cacheService.connect();
    
    server = http.createServer(app);
    
    server.listen(PORT, () => {
      logger.info(`Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });

    startBackgroundJobs();

    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        await cacheService.disconnect();
        await disconnectDB();
        
        logger.info('Process terminated');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default server;
