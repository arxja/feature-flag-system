import Joi from 'joi';

// Targeting rule validation
const targetingRuleSchema = Joi.object({
  type: Joi.string().valid('percentage', 'user_ids', 'user_attribute', 'whitelist').required(),
  value: Joi.when('type', {
    switch: [
      { is: 'percentage', then: Joi.number().min(0).max(100).required() },
      { is: 'user_ids', then: Joi.array().items(Joi.string()).min(1).required() },
      { is: 'whitelist', then: Joi.array().items(Joi.string()).min(1).required() },
      { is: 'user_attribute', then: Joi.object().min(1).required() },
    ],
    otherwise: Joi.forbidden()
  })
});
});

// Environment config validation
const environmentConfigSchema = Joi.object({
  name: Joi.string().valid('development', 'staging', 'production').required(),
  enabled: Joi.boolean().default(false),
  rolloutPercentage: Joi.number().min(0).max(100)
});

// Create flag validation schema
export const createFlagValidation = Joi.object({
  key: Joi.string()
    .pattern(/^[a-z0-9_]+$/)
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Key must contain only lowercase letters, numbers, and underscores',
      'string.empty': 'Key is required',
      'any.required': 'Key is required'
    }),
  
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required'
    }),
  
  description: Joi.string()
    .max(500)
    .optional(),
  
  enabled: Joi.boolean()
    .default(false),
  
  rolloutPercentage: Joi.number()
    .min(0)
    .max(100)
    .default(0),
  
  targetingRules: Joi.array()
    .items(targetingRuleSchema)
    .default([]),
  
  environments: Joi.array()
    .items(environmentConfigSchema)
    .default([]),
  
  tags: Joi.array()
    .items(Joi.string())
    .default([]),
  
  schedule: Joi.object({
    enabled: Joi.boolean().default(false),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }).optional()
});

// Update flag validation schema
export const updateFlagValidation = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional(),
  
  description: Joi.string()
    .max(500)
    .optional(),
  
  enabled: Joi.boolean()
    .optional(),
  
  rolloutPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional(),
  
  targetingRules: Joi.array()
    .items(targetingRuleSchema)
    .optional(),
  
  environments: Joi.array()
    .items(environmentConfigSchema)
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string())
    .optional(),
  
  schedule: Joi.object({
    enabled: Joi.boolean().default(false),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }).optional()
});

// Query params validation
export const flagQueryValidation = Joi.object({
  search: Joi.string().optional().allow(''),
  tags: Joi.string().optional(),
  enabled: Joi.boolean().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20)
});

// Batch toggle validation
export const batchToggleValidation = Joi.object({
  keys: Joi.array().items(Joi.string()).min(1).required(),
  enabled: Joi.boolean().required()
});