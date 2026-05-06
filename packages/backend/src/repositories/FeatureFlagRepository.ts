import { FeatureFlag, IFeatureFlag } from '../models/FeatureFlag.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { cacheService } from '../services/cache.service.js';

export interface FindFlagsFilters {
  search?: string;
  tags?: string[];
  enabled?: boolean;
  environment?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class FeatureFlagRepository {
  async create(data: Partial<IFeatureFlag>): Promise<IFeatureFlag> {
    try {
      const existing = await FeatureFlag.findOne({ key: data.key }).exec();
      if (existing) {
        throw new AppError(`Feature flag with key "${data.key}" already exists`, 409);
      }

      const flag = new FeatureFlag(data);
      await flag.save();

      logger.info(`Created feature flag: ${flag.key}`);
      return flag;
    } catch (error) {
      logger.error('Error creating feature flag:', error);
      throw error;
    }
  }

  async findByKey(key: string): Promise<IFeatureFlag | null> {
    try {
      return await FeatureFlag.findOne({ key }).exec();
    } catch (error) {
      logger.error(`Error finding flag ${key}:`, error);
      throw error;
    }
  }

  async findByKeyWithCache(key: string): Promise<IFeatureFlag | null> {
    try {
      const cached = await cacheService.get(key);
      if (cached) {
        return cached;
      }

      const flag = await this.findByKey(key);

      if (flag) {
        await cacheService.set(key, flag.toObject(), flag.__v);
      }

      return flag;
    } catch (error) {
      logger.error(`Error finding flag ${key} with cache:`, error);
      return this.findByKey(key);
    }
  }

  async updateWithVersion(
    key: string,
    updates: Partial<IFeatureFlag>,
    userId: string,
    userEmail: string,
    expectedVersion: number
  ): Promise<IFeatureFlag> {
    try {
      const existing = await this.findByKey(key);
      if (!existing) {
        throw new AppError(`Feature flag "${key}" not found`, 404);
      }

      const updated = await FeatureFlag.findOneAndUpdate(
        {
          key,
          __v: expectedVersion,
        },
        {
          ...updates,
          updatedBy: { userId, email: userEmail },
          updatedAt: new Date(),
          $inc: { __v: 1 },
        },
        {
          new: true,
          runValidators: true,
          optimisticConcurrency: true,
        }
      ).exec();

      if (!updated) {
        const stillExists = await this.findByKey(key);
        if (!stillExists) {
          throw new AppError(`Feature flag "${key}" not found`, 404);
        }

        throw new AppError(
          `Flag "${key}" was modified by another user. Current version: ${stillExists.__v}, Your version: ${expectedVersion}`,
          409
        );
      }

      await cacheService.invalidate(key);

      try {
        await AuditLog.create({
          flagKey: key,
          action: 'UPDATE',
          changes: {
            before: { ...existing.toObject(), __v: expectedVersion },
            after: { ...updated.toObject(), __v: updated.__v },
          },
          userId,
          userEmail,
        });
      } catch (auditError) {
        logger.error(`Audit log write failed for flag ${key}:`, auditError);
      }

      logger.info(`Updated feature flag: ${key} to version ${updated.__v}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating flag ${key}:`, error);
      throw error;
    }
  }

  async findAll(filters: FindFlagsFilters): Promise<PaginatedResult<IFeatureFlag>> {
    try {
      const { search, tags, enabled, environment, page = 1, limit = 20 } = filters;

      const query: any = {};

      if (search) {
        query.$or = [
          { key: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (enabled !== undefined) {
        query.enabled = enabled;
      }

      if (environment) {
        query['environments.name'] = environment;
      }

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        FeatureFlag.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
        FeatureFlag.countDocuments(query).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Error finding flags:', error);
      throw error;
    }
  }

  async update(
    key: string,
    updates: Partial<IFeatureFlag>,
    userId: string,
    userEmail: string
  ): Promise<IFeatureFlag> {
    const flag = await this.findByKey(key);
    if (!flag) {
      throw new AppError(`Feature flag "${key}" not found`, 404);
    }

    return this.updateWithVersion(key, updates, userId, userEmail, flag.__v);
  }

  async toggle(key: string, userId: string, userEmail: string): Promise<IFeatureFlag> {
    const flag = await this.findByKey(key);
    if (!flag) {
      throw new AppError(`Feature flag "${key}" not found`, 404);
    }

    return this.updateWithVersion(key, { enabled: !flag.enabled }, userId, userEmail, flag.__v);
  }

  async softDelete(key: string, userId: string, userEmail: string): Promise<void> {
    try {
      const flag = await this.findByKey(key);
      if (!flag) {
        throw new AppError(`Feature flag "${key}" not found`, 404);
      }

      await this.updateWithVersion(key, { enabled: false }, userId, userEmail, flag.__v);

      await AuditLog.create({
        flagKey: key,
        action: 'DELETE',
        changes: { before: flag.toObject(), after: { enabled: false } },
        userId,
        userEmail,
      });

      logger.info(`Soft deleted feature flag: ${key}`);
    } catch (error) {
      logger.error(`Error deleting flag ${key}:`, error);
      throw error;
    }
  }

  async bulkToggle(
    keys: string[],
    enabled: boolean,
    userId: string,
    userEmail: string
  ): Promise<number> {
    try {
      const flags = await FeatureFlag.find({ key: { $in: keys } }).exec();
      let modifiedCount = 0;
      const updatedKeys: string[] = [];

      for (const flag of flags) {
        try {
          await this.updateWithVersion(flag.key, { enabled }, userId, userEmail, flag.__v);
          modifiedCount++;
        } catch (error) {
          logger.warn(`Failed to update flag ${flag.key}:`, error);
        }
      }

      if (updatedKeys.length > 0) {
        await cacheService.invalidateMany(updatedKeys);
      }

      await AuditLog.create({
        flagKey: 'BULK',
        action: 'BULK_UPDATE',
        changes: { keys, enabled, modifiedCount },
        userId,
        userEmail,
      });

      logger.info(`Bulk toggled ${modifiedCount} of ${keys.length} flags to ${enabled}`);
      return modifiedCount;
    } catch (error) {
      logger.error('Error in bulk toggle:', error);
      throw error;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const result = await FeatureFlag.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags' } },
        { $sort: { _id: 1 } },
      ]).exec();
      return result.map((r) => r._id);
    } catch (error) {
      logger.error('Error getting tags:', error);
      return [];
    }
  }

  async deleteAll(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Cannot delete all flags in production', 403);
    }

    await FeatureFlag.deleteMany({}).exec();
    logger.warn('All feature flags deleted (testing only)');
  }
}

export const featureFlagRepository = new FeatureFlagRepository();
