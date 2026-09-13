import { Router } from 'express';
import { env } from '../config/env.js';
import { safeEqual } from '../utils/security.js';
import { runTamperCheck } from '../security/tamper.js';

const router = Router();
router.get('/monitor', async (req, res) => {
  const supplied = req.get('x-monitor-secret') || '';
  if (!safeEqual(supplied, env.MONITOR_SECRET)) return res.status(401).json({ error: 'Unauthorized' });
  const result = await runTamperCheck();
  res.status(result.ok ? 200 : 500).json(result);
});
export default router;
