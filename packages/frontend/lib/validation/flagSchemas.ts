import { z } from 'zod';

// Targeting rule schema
export const targetingRuleSchema = z.object({
  type: z.enum(['percentage', 'user_ids', 'user_attribute', 'whitelist']),
  value: z.any(),
});

// Environment config schema
export const environmentConfigSchema = z.object({
  name: z.enum(['development', 'staging', 'production']),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
});

// Main feature flag schema
export const featureFlagSchema = z.object({
  key: z.string()
    .min(1, 'Flag key is required')
    .max(50, 'Flag key must be less than 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed'),
  
  name: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  enabled: z.boolean().default(false),
  
  rolloutPercentage: z.number()
    .min(0, 'Rollout percentage must be at least 0')
    .max(100, 'Rollout percentage cannot exceed 100')
    .default(0),
  
  targetingRules: z.array(targetingRuleSchema).default([]),
  
  environments: z.array(environmentConfigSchema).default([]),
  
  tags: z.array(z.string()).default([]),
  
  schedule: z.object({
    enabled: z.boolean().default(false),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).optional(),
  
  createdBy: z.object({
    userId: z.string(),
    email: z.string().email(),
  }).optional(),
  
  updatedBy: z.object({
    userId: z.string(),
    email: z.string().email(),
  }).optional(),
});

// Create flag form schema (for frontend)
export const createFlagFormSchema = z.object({
  key: z.string()
    .min(1, 'Flag key is required')
    .max(50, 'Flag key must be less than 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores allowed'),
  
  name: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  enabled: z.boolean().default(false),
  
  rolloutPercentage: z.coerce.number()
    .min(0, 'Rollout percentage must be at least 0')
    .max(100, 'Rollout percentage cannot exceed 100'),
  
  tags: z.array(z.string()).default([]),
});

// Edit flag form schema
export const editFlagFormSchema = z.object({
  name: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  enabled: z.boolean(),
  
  rolloutPercentage: z.coerce.number()
    .min(0, 'Rollout percentage must be at least 0')
    .max(100, 'Rollout percentage cannot exceed 100'),
  
  tags: z.array(z.string()),
});

// Batch evaluation schema
export const batchEvaluationSchema = z.object({
  userId: z.string().optional(),
  userAttributes: z.record(z.any(), z.any()).optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  flagKeys: z.array(z.string()).optional(),
});

// Type inference
export type CreateFlagFormData = z.infer<typeof createFlagFormSchema>;
export type EditFlagFormData = z.infer<typeof editFlagFormSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type BatchEvaluationRequest = z.infer<typeof batchEvaluationSchema>;