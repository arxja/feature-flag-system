import { Router, Request, Response } from 'express';
import { sseManager } from '../services/sse.service.js';
import { randomUUID } from 'crypto';

const router = Router();
router.get('/api/sse', (req: Request, res: Response) => {
  const clientId = randomUUID();

  sseManager.addClient(clientId, res);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(`: heartbeat\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(clientId);
  });
});

// SSE Stats Endpoint (for debugging)
router.get('/api/sse/stats', (req: Request, res: Response) => {
  const stats = sseManager.getStats();
  res.json(stats);
});

export default router;
