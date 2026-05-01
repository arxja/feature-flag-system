import { Router, Request, Response } from 'express';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { evaluator, EvaluationContext } from '../services/FeatureFlagEvaluator.service.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

const router = Router();


router.get('/api/evaluate/:flagKey', async (req: Request, res: Response) => {
  try {
    const { flagKey } = req.params;
    
    const context: EvaluationContext = {
        userId: req.query.userId as string,
        userAttributes: {},
        environment: req.query.environment as any,
    };
    
    const { userId, environment, ...attributeParams } = req.query;
    if (Object.keys(attributeParams).length > 0) {
      context.userAttributes = attributeParams;
    }
    
    const flag = await FeatureFlag.findOne({ key: flagKey }).lean();
    
    if (!flag) {
      res.status(404).json({ error: `Flag '${flagKey}' not found` });
      return;
    }
    
    const result = await evaluator.evaluate(flag, context);
    
    res.json(result);
    
  } catch (error) {
    logger.error('Evaluation error:', error);
    res.status(500).json({ error: 'Evaluation failed' });
  }
});

router.post('/api/evaluate/batch', async (req: Request, res: Response) => {
  try {
    const { userId, userAttributes, environment, flagKeys } = req.body;
    
    const context: EvaluationContext = {
      userId,
      userAttributes,
      environment,
    };
    
    let flags: any[] = [];
    
    if (flagKeys && flagKeys.length > 0) {
      flags = await FeatureFlag.find({ key: { $in: flagKeys } }).lean();
    } else {
      flags = await FeatureFlag.find({ enabled: true }).lean();
    }
    
    const results = await evaluator.evaluateBulk(flags, context);
    
    res.json({
      userId: userId || 'anonymous',
      timestamp: Date.now(),
      flags: results,
    });
    
  } catch (error) {
    logger.error('Batch evaluation error:', error);
    res.status(500).json({ error: 'Batch evaluation failed' });
  }
});

router.get('/api/evaluate/:flagKey/explain', async (req: Request, res: Response) => {
  try {
    const { flagKey } = req.params;
    
    const flag = await FeatureFlag.findOne({ key: flagKey }).lean();
    
    if (!flag) {
      res.status(404).json({ error: `Flag '${flagKey}' not found` });
      return;
    }
    
    res.json({
      flagKey: flag.key,
      name: flag.name,
      description: flag.description,
      configuration: {
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        targetingRules: flag.targetingRules,
        environments: flag.environments,
        schedule: flag.schedule,
      },
      evaluationLogic: {
        priority: [
          '1. Master enabled flag',
          '2. Schedule dates (if set)',
          '3. Environment override',
          '4. Targeting rules (whitelist > specific users > attributes > percentages)',
          '5. Percentage rollout (deterministic hashing)',
          '6. Default false',
        ],
      },
    });
    
  } catch (error) {
    logger.error('Explain error:', error);
    res.status(500).json({ error: 'Failed to get explanation' });
  }
});

router.post('/api/evaluate/test-setup', async (req: Request, res: Response) => {
    if (config.NODE_ENV !== 'development') {
        return res.status(404).end();
    }
  try {
    const testFlags = [
      {
        key: 'premium_features',
        name: 'Premium Features',
        description: 'Features for premium users only',
        enabled: true,
        rolloutPercentage: 0,
        targetingRules: [
          {
            type: 'user_attribute',
            value: { tier: 'premium' }
          }
        ],
        environments: [
          { name: 'development', enabled: true },
          { name: 'staging', enabled: true },
          { name: 'production', enabled: true }
        ],
        tags: ['test', 'premium'],
        createdBy: { userId: 'system', email: 'system@localhost' },
        updatedBy: { userId: 'system', email: 'system@localhost' },
      },
      {
        key: 'beta_testing',
        name: 'Beta Testing Features',
        description: 'Early access for beta testers',
        enabled: true,
        rolloutPercentage: 10,
        targetingRules: [
          {
            type: 'user_ids',
            value: ['beta_tester_1', 'beta_tester_2']
          }
        ],
        environments: [
          { name: 'development', enabled: true },
          { name: 'staging', enabled: true },
          { name: 'production', enabled: false }
        ],
        tags: ['test', 'beta'],
        createdBy: { userId: 'system', email: 'system@localhost' },
        updatedBy: { userId: 'system', email: 'system@localhost' },
      },
      {
        key: 'gradual_rollout',
        name: 'Gradual Feature Release',
        description: 'Slowly roll out to 25% of users',
        enabled: true,
        rolloutPercentage: 25,
        targetingRules: [],
        environments: [
          { name: 'development', enabled: true, rolloutPercentage: 100 },
          { name: 'staging', enabled: true, rolloutPercentage: 50 },
          { name: 'production', enabled: true, rolloutPercentage: 25 }
        ],
        tags: ['test', 'rollout'],
        createdBy: { userId: 'system', email: 'system@localhost' },
        updatedBy: { userId: 'system', email: 'system@localhost' },
      },
      {
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Dark theme UI',
        enabled: true,
        rolloutPercentage: 100,
        targetingRules: [],
        tags: ['test', 'ui'],
        createdBy: { userId: 'system', email: 'system@localhost' },
        updatedBy: { userId: 'system', email: 'system@localhost' },
      }
    ];
    
    for (const flag of testFlags) {
      await FeatureFlag.findOneAndUpdate(
        { key: flag.key },
        flag,
        { upsert: true, new: true }
      );
    }
    
    res.json({ 
      message: 'Test flags created successfully',
      flags: testFlags.map(f => f.key)
    });
    
  } catch (error) {
    logger.error('Test setup error:', error);
    res.status(500).json({ error: 'Failed to create test flags' });
  }
});

export default router;