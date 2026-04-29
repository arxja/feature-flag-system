import { z } from 'zod';

export const TargetingRuleSchema = z.object({
    type: z.enum(['percentage', 'user_ids', 'user_attribute', 'whitelist']),
    value: z.any(),
});

export const EnvironmentConfigSchema = z.object({
    name: z.enum(['development', 'staging', 'production']),
    enabled: z.boolean(),
    rolloutPercentage: z.number().min(0).max(100).optional(),
});

export const FeatureFlagSchema = z.object({
    key: z.string().regex(/^[a-z0-9_]+$/, 'Must be lowercase, numbers, and underscore only'),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    enabled: z.boolean().default(false),
    targetingRules: z.array(TargetingRuleSchema).default([]),
    rolloutPercentage: z.number().min(0).max(100).default(0),
    environments: z.array(EnvironmentConfigSchema).default([]),
    tags: z.array(z.string()).default([]),
    schedule: z.object({
        enabled: z.boolean().default(false),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }).optional(),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type TargetingRule = z.infer<typeof TargetingRuleSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export interface EvaluationContext {
    userId?: string;
    userAttributes?: Record<string, any>;
    environment?: string;
    timestamp?: Date;
}

    export interface EvaluationResult {
    flagKey: string;
    enabled: boolean;
    reason: string; // 'global_enabled', 'percentage_rollout', 'targeting_rule', etc.
    timestamp: number;
    ttl?: number;
}