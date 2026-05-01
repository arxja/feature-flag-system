import { FeatureFlag, IFeatureFlag } from '../models/FeatureFlag.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';


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
                FeatureFlag.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
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
        try {
            const existing = await this.findByKey(key);
            if (!existing) {
                throw new AppError(`Feature flag "${key}" not found`, 404);
            }
            
            const before = existing.toObject();

            const updatePayload: any = {
                ...updates,
                updatedBy: { userId, email: userEmail },
                updatedAt: new Date(),
            };
            
            const updated = await FeatureFlag.findOneAndUpdate(
                { key },
                updatePayload,
                { new: true, runValidators: true }
            ).exec();
            
            if (!updated) {
                throw new AppError(`Failed to update flag "${key}"`, 500);
            }
            
            await AuditLog.create({
                flagKey: key,
                action: 'UPDATE',
                changes: { before, after: updated.toObject() },
                userId,
                userEmail,
            });
            
            logger.info(`Updated feature flag: ${key} by ${userEmail}`);
            return updated;
            
        } catch (error) {
        logger.error(`Error updating flag ${key}:`, error);
        throw error;
        }
    }
    async toggle(
        key: string,
        userId: string,
        userEmail: string
    ): Promise<IFeatureFlag> {
        const flag = await this.findByKey(key);
        if (!flag) {
            throw new AppError(`Feature flag "${key}" not found`, 404);
        }
        
        return this.update(key, { enabled: !flag.enabled }, userId, userEmail);
    }

    async softDelete(key: string, userId: string, userEmail: string): Promise<void> {
        try {
            const flag = await this.findByKey(key);
            if (!flag) {
                throw new AppError(`Feature flag "${key}" not found`, 404);
            }

            await FeatureFlag.findOneAndUpdate(
                { key },
                {
                    enabled: false,
                    updatedBy: { userId, email: userEmail },
                    updatedAt: new Date(),
                },
                { new: true, runValidators: true }
            ).exec();
            
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
            const result = await FeatureFlag.updateMany(
                { key: { $in: keys } },
                {
                    enabled,
                    updatedBy: { userId, email: userEmail },
                    updatedAt: new Date(),
                }
            ).exec();
            
            await AuditLog.create({
                flagKey: 'BULK',
                action: 'BULK_UPDATE',
                changes: { 
                    before: { keys, previousStates: 'not captured' },
                    after: { keys, enabled }
                },
                userId,
                userEmail,
            });
            
            logger.info(`Bulk toggled ${result.modifiedCount} flags to ${enabled}`);
            return result.modifiedCount || 0;
            
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
            return result.map(r => r._id);
        } catch (error) {
            logger.error('Error getting tags:', error);
            return [];
        }
    }

    /**
   * Delete all flags (for testing only!)
   */
    async deleteAll(): Promise<void> {
        if (process.env.NODE_ENV === 'production') {
        throw new AppError('Cannot delete all flags in production', 403);
        }
        
        await FeatureFlag.deleteMany({}).exec();
        logger.warn('All feature flags deleted (testing only)');
    }
}

export const featureFlagRepository = new FeatureFlagRepository();