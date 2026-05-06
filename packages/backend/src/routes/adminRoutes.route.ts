import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  createFlagValidation,
  updateFlagValidation,
  flagQueryValidation,
  batchToggleValidation
} from '../schemas/flagValidation.js';
import { adminController } from '../controllers/admin.controller.js';

const router = Router();

// Flag CRUD operations
router.get('/api/admin/flags', validate(flagQueryValidation), adminController.getAllFlags);
router.get('/api/admin/flags/tags', adminController.getTags);
router.get('/api/admin/flags/:key', adminController.getFlagByKey);
router.post('/api/admin/flags', validate(createFlagValidation), adminController.createFlag);
router.patch('/api/admin/flags/:key', validate(updateFlagValidation), adminController.updateFlag);
router.post('/api/admin/flags/:key/toggle', adminController.toggleFlag);
router.post('/api/admin/flags/bulk/toggle', validate(batchToggleValidation), adminController.bulkToggleFlags);
router.delete('/api/admin/flags/:key', adminController.deleteFlag);

// Audit and stats
router.get('/api/admin/flags/:key/audit', adminController.getAuditLogs);
router.get('/api/admin/stats', adminController.getStats);

export default router;