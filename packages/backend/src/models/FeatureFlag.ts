import { Schema, model, Document, Model } from 'mongoose';
import { logger } from '../utils/logger.js';

export interface ITargetingRule {
    type: 'percentage' | 'user_ids' | 'user_attribute' | 'whitelist';
    value: number | string[] | Record<string, any>;
}

export interface IEnvironmentConfig {
    name: 'development' | 'staging' | 'production';
    enabled: boolean;
    rolloutPercentage?: number;
}

export interface ISchedule {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
}

export interface IAuditUser {
    userId: string;
    email: string;
}

export interface IFeatureFlag extends Document {
    // Core fields
    key: string;
    name: string;
    description?: string;
    
    // Flag control
    enabled: boolean;
    rolloutPercentage: number;
    
    // Rules & targeting
    targetingRules: ITargetingRule[];
    environments: IEnvironmentConfig[];
    
    // Metadata
    tags: string[];
    schedule?: ISchedule;
    
    // Audit
    createdBy: IAuditUser;
    updatedBy: IAuditUser;
    
    // Virtuals
    isActive: boolean;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const targetingRuleSchema = new Schema<ITargetingRule>({
    type: {
        type: String,
        enum: ['percentage', 'user_ids', 'user_attribute', 'whitelist'],
        required: true,
    },
    value: {
        type: Schema.Types.Mixed,
        required: true,
        validate: function(value: any) {
            const rule = this as ITargetingRule;
            if (rule.type === 'percentage') {
                return typeof value === 'number' && value >= 0 && value <= 100;
            }
            if (rule.type === 'user_ids') {
                return Array.isArray(value) && value.length > 0;
            }
            if (rule.type === 'user_attribute') {
                return typeof value === 'object' && value !== null;
            }
            if (rule.type === 'whitelist') {
                return Array.isArray(value) && value.length > 0;
            }
            return false;
        }
    },
}, { _id: false });

const environmentConfigSchema = new Schema<IEnvironmentConfig>({
    name: {
        type: String,
        enum: ['development', 'staging', 'production'],
        required: true,
    },
    enabled: {
        type: Boolean,
        default: false,
    },
    rolloutPercentage: {
        type: Number,
        min: 0,
        max: 100,
    },
}, { _id: false });

const auditUserSchema = new Schema<IAuditUser>({
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
}, { _id: false });

const featureFlagSchema = new Schema<IFeatureFlag>(
    {
        key: {
            type: String,
            required: [true, 'Flag key is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^[a-z0-9_]+$/, 'Key must contain only lowercase letters, numbers, and underscores'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Flag name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            trim: true,
        },
        enabled: {
            type: Boolean,
            default: false,
            index: true,
        },
        rolloutPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        targetingRules: {
            type: [targetingRuleSchema],
            default: [],
        },
        environments: {
            type: [environmentConfigSchema],
            default: [],
        },
        tags: {
            type: [String],
            index: true,
            default: [],
        },
        schedule: {
            enabled: { type: Boolean, default: false },
            startDate: { type: Date },
            endDate: { type: Date },
        },
        createdBy: {
            type: auditUserSchema,
            required: true,
        },
        updatedBy: {
            type: auditUserSchema,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { 
            virtuals: true,
            transform: (doc, ret) => {
                const { __v, ...rest } = ret;
                return rest;
            }
        },
        toObject: { virtuals: true },
    }
);

// Compound index for tag + enabled queries
featureFlagSchema.index({ tags: 1, enabled: -1 });

// Environment queries
featureFlagSchema.index({ 'environments.name': 1, 'environments.enabled': 1 });

// For admin dashboard pagination
featureFlagSchema.index({ createdAt: -1 });

featureFlagSchema.virtual('isActive').get(function(this: IFeatureFlag) {
    if (!this.enabled) return false;
    
    if (this.schedule?.enabled) {
        const now = new Date();
        if (this.schedule.startDate && now < this.schedule.startDate) return false;
        if (this.schedule.endDate && now > this.schedule.endDate) return false;
    }
    
    return true;
});

featureFlagSchema.methods.getEffectiveEnabled = function(
    this: IFeatureFlag,
    environment?: string
): boolean {
    if (!environment) return this.enabled;
    
    const envConfig = this.environments.find(e => e.name === environment);
    if (!envConfig) return this.enabled;
    
    return envConfig.enabled;
};

featureFlagSchema.methods.getEffectiveRollout = function(
    this: IFeatureFlag,
    environment?: string
    ): number {
    if (!environment) return this.rolloutPercentage;
    
    const envConfig = this.environments.find(e => e.name === environment);
    if (!envConfig?.rolloutPercentage) return this.rolloutPercentage;
    
    return envConfig.rolloutPercentage;
};

featureFlagSchema.statics.findByKey = async function(key: string): Promise<IFeatureFlag | null> {
    return this.findOne({ key }).exec();
};

featureFlagSchema.statics.findActiveByTags = async function(tags: string[]): Promise<IFeatureFlag[]> {
    return this.find({ 
        tags: { $in: tags },
        enabled: true,
    }).exec();
};

featureFlagSchema.pre('save', async function(this: IFeatureFlag) {
    if (this.environments.length === 0) {
        this.environments = [
        { name: 'development', enabled: this.enabled, rolloutPercentage: this.rolloutPercentage },
        { name: 'staging', enabled: false, rolloutPercentage: 0 },
        { name: 'production', enabled: false, rolloutPercentage: 0 },
        ];
    }
    
    logger.debug(`Saving feature flag: ${this.key} by ${this.updatedBy?.email || 'unknown'}`);
    return;
});

featureFlagSchema.post('save', function(doc: IFeatureFlag) {
  logger.info(`Feature flag saved: ${doc.key} (enabled: ${doc.enabled})`);
});

featureFlagSchema.post('findOneAndUpdate', function(doc: IFeatureFlag | null) {
  if (doc) {
    logger.info(`Feature flag updated: ${doc.key}`);
  }
});

// Add static methods to Model interface
interface IFeatureFlagModel extends Model<IFeatureFlag> {
    findByKey(key: string): Promise<IFeatureFlag | null>;
    findActiveByTags(tags: string[]): Promise<IFeatureFlag[]>;
}

export const FeatureFlag = model<IFeatureFlag, IFeatureFlagModel>(
    'FeatureFlag',
    featureFlagSchema
);