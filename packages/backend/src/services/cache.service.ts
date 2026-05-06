import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export class CacheService {
  private readonly DEFAULT_TTL = 30; // 30 seconds
  private readonly VERSION_KEY = 'flag_versions'; // Redis hash for version tracking

  async get(flagKey: string): Promise<any | null> {
    if (!redis.isReady()) {
      return null;
    }

    try {
      const client = redis.getClient();

      const currentVersion = await client?.hget(this.VERSION_KEY, flagKey);
      if (!currentVersion) {
        return null; // No version tracking = cache miss
      }

      const cacheKey = `flag:${flagKey}:v${currentVersion}`;
      const data = await client?.get(cacheKey);

      if (data) {
        logger.debug(`Cache HIT: ${flagKey} (v${currentVersion})`);
        return JSON.parse(data);
      }

      logger.debug(`Cache MISS: ${flagKey}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${flagKey}:`, error);
      return null; // Fail open
    }
  }

  async set(
    flagKey: string,
    flagData: any,
    version: number,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    if (!redis.isReady()) {
      return;
    }

    try {
      const client = redis.getClient();
      const cacheKey = `flag:${flagKey}:v${version}`;

      await client?.setex(cacheKey, ttl, JSON.stringify(flagData));

      await client?.hset(this.VERSION_KEY, flagKey, version.toString());

      logger.debug(`Cached flag: ${flagKey} v${version} for ${ttl}s`);
    } catch (error) {
      logger.error(`Cache set error for ${flagKey}:`, error);
    }
  }

  async invalidate(flagKey: string): Promise<void> {
    if (!redis.isReady()) {
      return;
    }

    try {
      const client = redis.getClient();

      const newVersion = await client?.hincrby(this.VERSION_KEY, flagKey, 1);

      logger.info(`Cache invalidated: ${flagKey} → v${newVersion}`);
    } catch (error) {
      logger.error(`Cache invalidate error for ${flagKey}:`, error);
    }
  }

  async getVersion(flagKey: string): Promise<number | null> {
    if (!redis.isReady()) {
      return null;
    }

    try {
      const client = redis.getClient();
      const version = await client?.hget(this.VERSION_KEY, flagKey);
      return version ? parseInt(version) : null;
    } catch (error) {
      logger.error(`Get version error for ${flagKey}:`, error);
      return null;
    }
  }

  async invalidateMany(flagKeys: string[]): Promise<void> {
    if (!redis.isReady() || flagKeys.length === 0) {
      return;
    }

    try {
      const client = redis.getClient();
      const pipeline = client?.pipeline();

      for (const key of flagKeys) {
        pipeline?.hincrby(this.VERSION_KEY, key, 1);
      }

      await pipeline?.exec();
      logger.info(`Bulk cache invalidated: ${flagKeys.length} flags`);
    } catch (error) {
      logger.error('Bulk cache invalidate error:', error);
    }
  }

  async clearAll(): Promise<void> {
    if (!redis.isReady()) {
      return;
    }

    try {
      const client = redis.getClient();
      await client?.del(this.VERSION_KEY);

      const keys = await client?.keys('flag:*');
      if (keys && keys.length > 0) {
        await client?.del(...keys);
      }

      logger.warn('Entire Redis cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }
}

export const cacheService = new CacheService();
