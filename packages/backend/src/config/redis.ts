import type { Redis as RedisType } from 'ioredis';
import { logger } from '../utils/logger.js';
import ioredis from 'ioredis';


const Redis = ioredis.default || ioredis;

class RedisConnection {
  private client: RedisType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis reconnecting... attempt ${times}`);
          return delay;
        },
        // Don't fail the app if Redis is down
        enableReadyCheck: true,
        lazyConnect: true,
      });

      await this.client.connect();
      this.isConnected = true;
      
      logger.info('✅ Redis connected successfully');
      
      this.client.on('error', (error) => {
        logger.error('Redis error:', error);
        this.isConnected = false;
      });
      
    } catch (error) {
      logger.error('❌ Redis connection failed (caching disabled):', error);
      this.isConnected = false;
      // Don't throw - app continues without cache
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const redis = new RedisConnection();