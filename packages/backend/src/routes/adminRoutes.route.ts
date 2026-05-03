import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate.js';
import {
  createFlagValidation,
  updateFlagValidation,
  flagQueryValidation,
  batchToggleValidation
} from '../schemas/flagValidation.js';
import { featureFlagRepository } from '../repositories/FeatureFlagRepository.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ! temp
const getCurrentUser = (req: Request) => ({
  userId: 'system',
  email: 'system@localhost'
});

router.get('/api/admin/flags', validate(flagQueryValidation), async (req: Request, res: Response) => {
  try {
    const { search, tags, enabled, page, limit } = req.validatedData;
    
    const result = await featureFlagRepository.findAll({
      search: search as string | undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      enabled: enabled !== undefined ? enabled as boolean : undefined,
      page: page as number,
      limit: limit as number
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error fetching flags:', error);
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
});

router.get('/api/admin/flags/tags', async (req: Request, res: Response) => {
  try {
    const tags = await featureFlagRepository.getAllTags();
    res.json({ tags });
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/api/admin/flags/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ error: 'Flag key is required' });
      return;
    }
    
    const flag = await featureFlagRepository.findByKey(key);
    
    if (!flag) {
      res.status(404).json({ error: `Flag '${key}' not found` });
      return;
    }
    
    res.json(flag);
  } catch (error) {
    logger.error('Error fetching flag:', error);
    res.status(500).json({ error: 'Failed to fetch flag' });
  }
});

router.post('/api/admin/flags', validate(createFlagValidation), async (req: Request, res: Response) => {
  try {
    const flagData = req.validatedData;
    const user = getCurrentUser(req);
    
    const flag = await featureFlagRepository.create({
      ...flagData,
      createdBy: { userId: user.userId, email: user.email },
      updatedBy: { userId: user.userId, email: user.email }
    });
    
    logger.info(`Flag created: ${flag.key}`);
    res.status(201).json(flag);
  } catch (error: any) {
    logger.error('Error creating flag:', error);
    
    if (error.message?.includes('already exists')) {
      res.status(409).json({ error: error.message });
      return;
    }
    
    res.status(400).json({ error: error.message || 'Failed to create flag' });
  }
});

router.patch('/api/admin/flags/:key', validate(updateFlagValidation), async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ error: 'Flag key is required' });
      return;
    }
    
    const updates = req.validatedData;
    const user = getCurrentUser(req);
    
    const flag = await featureFlagRepository.update(
      key,
      updates,
      user.userId,
      user.email
    );
    
    logger.info(`Flag updated: ${key}`);
    res.json(flag);
  } catch (error: any) {
    logger.error('Error updating flag:', error);
    
    if (error.message?.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    res.status(400).json({ error: error.message || 'Failed to update flag' });
  }
});

router.post('/api/admin/flags/:key/toggle', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ error: 'Flag key is required' });
      return;
    }
    
    const user = getCurrentUser(req);
    
    const flag = await featureFlagRepository.findByKey(key);
    if (!flag) {
      res.status(404).json({ error: `Flag '${key}' not found` });
      return;
    }
    
    const updated = await featureFlagRepository.update(
      key,
      { enabled: !flag.enabled },
      user.userId,
      user.email
    );
    
    logger.info(`Flag toggled: ${key} -> ${updated.enabled}`);
    res.json({ 
      key: updated.key,
      enabled: updated.enabled,
      message: `Flag ${updated.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    logger.error('Error toggling flag:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle flag' });
  }
});

router.post('/api/admin/flags/bulk/toggle', validate(batchToggleValidation), async (req: Request, res: Response) => {
  try {
    const { keys, enabled } = req.validatedData;
    const user = getCurrentUser(req);
    
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({ error: 'Keys array is required' });
      return;
    }
    
    const count = await featureFlagRepository.bulkToggle(
      keys as string[],
      enabled as boolean,
      user.userId,
      user.email
    );
    
    logger.info(`Bulk toggled ${count} flags to ${enabled}`);
    res.json({ 
      count,
      enabled,
      message: `${count} flag(s) ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error: any) {
    logger.error('Error in bulk toggle:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk toggle flags' });
  }
});

router.delete('/api/admin/flags/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ error: 'Flag key is required' });
      return;
    }
    
    const user = getCurrentUser(req);
    
    await featureFlagRepository.softDelete(key, user.userId, user.email);
    
    logger.info(`Flag deleted: ${key}`);
    res.json({ message: `Flag '${key}' deleted successfully` });
  } catch (error: any) {
    logger.error('Error deleting flag:', error);
    
    if (error.message?.includes('not found')) {
      res.status(404).json({ error: error.message });
      return;
    }
    
    res.status(500).json({ error: error.message || 'Failed to delete flag' });
  }
});

router.get('/api/admin/flags/:key/audit', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      res.status(400).json({ error: 'Flag key is required' });
      return;
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    
    const logs = await AuditLog.find({ flagKey: key })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    res.json({ logs, count: logs.length });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/api/admin/stats', async (req: Request, res: Response) => {
  try {
    const totalFlags = await FeatureFlag.countDocuments();
    const enabledFlags = await FeatureFlag.countDocuments({ enabled: true });
    const totalTags = await featureFlagRepository.getAllTags();
    
    const recentActivity = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    
    res.json({
      flags: {
        total: totalFlags,
        enabled: enabledFlags,
        disabled: totalFlags - enabledFlags
      },
      tags: {
        total: totalTags.length,
        list: totalTags.slice(0, 10)
      },
      recentActivity: recentActivity.map(log => ({
        action: log.action,
        flagKey: log.flagKey,
        userEmail: log.userEmail,
        timestamp: log.timestamp
      }))
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;