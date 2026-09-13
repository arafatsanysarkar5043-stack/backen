import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken } from '../utils/security.js';
import { securePayload } from '../utils/modelSecurity.js';
import { createAudit } from '../utils/audit.js';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';

const router = Router();
const reg = z.object({ name: z.string().min(2).max(100), email: z.string().email(), password: z.string().min(12).max(128), phone: z.string().max(30).optional() });
const login = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });

router.post('/register', validate(reg), async (req, res) => {
  const exists = await User.findOne({ email: req.body.email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await argon2.hash(req.body.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const base = { email: req.body.email.toLowerCase(), name: req.body.name, phone: req.body.phone, passwordHash, role: 'customer', permissions: [], active: true, createdAt: new Date(), updatedAt: new Date() };
  const user = await User.create(securePayload(base));
  await createAudit({ actorId: user._id, action: 'register', collection: 'users', documentId: user._id, ip: req.ip });
  res.status(201).json({ token: signToken({ sub: user._id.toString(), role: user.role }), user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});

router.post('/login', validate(login), async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash').lean();
  if (!user || !user.active || !(await argon2.verify(user.passwordHash, req.body.password))) return res.status(401).json({ error: 'Invalid credentials' });
  await createAudit({ actorId: user._id, action: 'login', collection: 'users', documentId: user._id, ip: req.ip });
  res.json({ token: signToken({ sub: user._id.toString(), role: user.role }), user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});

router.get('/me', auth, async (req, res) => res.json({ user: { id: req.user._id, email: req.user.email, name: req.user.name, phone: req.user.phone, role: req.user.role, permissions: req.user.permissions } }));
export default router;
