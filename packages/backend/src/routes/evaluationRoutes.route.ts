import { Router } from 'express';
import { evaluationController } from '../controllers/evaluation.controller.js';

const router = Router();

// Single flag evaluation
router.get('/api/evaluate/:flagKey', evaluationController.evaluateSingleFlag);

// Batch evaluation
router.post('/api/evaluate/batch', evaluationController.evaluateBatchFlags);

// Evaluation explanation endpoint
router.get('/api/evaluate/:flagKey/explain', evaluationController.explainEvaluationLogic);

// Test setup endpoint (development only)
router.post('/api/evaluate/test-setup', evaluationController.setupTestFlags);

export default router;