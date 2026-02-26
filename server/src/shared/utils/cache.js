import { createClient } from 'redis';
import config from '../../config/index.js';
import logger from './logger.js';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.enabled = config.redis.enabled;
  }

  async connect() {
    if (!this.enabled) {
      logger.info('Redis caching is disabled');
      return;
    }

    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('Redis client connected and ready');
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('end', () => {
        this.isConnected = false;
        logger.info('Redis client disconnected');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.enabled || !this.isConnected) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        logger.debug('Cache hit', { key });
        return JSON.parse(data);
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = config.redis.ttl.default) {
    if (!this.enabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.enabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug('Cache deleted', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.enabled || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug('Cache pattern deleted', { pattern, count: keys.length });
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error', { pattern, error: error.message });
      return false;
    }
  }

  async getOrSet(key, fetchFn, ttl = config.redis.ttl.default) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  async flush() {
    if (!this.enabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
      return false;
    }
  }

  generateKey(...parts) {
    return `healthbridge:${parts.join(':')}`;
  }

  keys = {
    services: () => this.generateKey('services', 'all'),
    servicesByCategory: (categoryId) => this.generateKey('services', 'category', categoryId),
    serviceById: (serviceId) => this.generateKey('service', serviceId),
    bookingStats: () => this.generateKey('stats', 'bookings'),
    userSession: (userId) => this.generateKey('session', userId),
    providerStats: (providerId) => this.generateKey('stats', 'provider', providerId),
    unreadNotifications: (userId) => this.generateKey('notifications', 'unread', userId),
  };

  ttl = config.redis.ttl;
}

const cacheService = new CacheService();

export default cacheService;
