import { Router } from 'express';
import mongoose from 'mongoose';
const router = Router();
router.get('/', (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', time: new Date().toISOString() }));
export default router;
