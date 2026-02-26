import mongoose from 'mongoose';
import config from './index.js';
import logger from '../shared/utils/logger.js';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(config.database.uri, config.database.options);
    
    isConnected = true;
    
    logger.info(`MongoDB Connected: ${connection.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });
    
    return connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  }
};

const healthCheck = async () => {
  try {
    const result = await mongoose.connection.db.admin().ping();
    return result.ok === 1;
  } catch (error) {
    logger.error('Database health check failed:', error.message);
    return false;
  }
};

export { connectDB, disconnectDB, healthCheck };
export default connectDB;
