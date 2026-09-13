import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import SecurityEvent from '../models/SecurityEvent.js';
import AuditLog from '../models/AuditLog.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { securePayload } from '../utils/modelSecurity.js';
import { createAudit } from '../utils/audit.js';

const router = Router();
router.use(auth, requireRoles('admin','manager','staff'));
router.get('/dashboard', async (req, res) => {
  const [products, categories, users, orders, pending, alerts] = await Promise.all([
    Product.countDocuments({ active: true }), Category.countDocuments({ active: true }), User.countDocuments(), Order.countDocuments(), Order.countDocuments({ status: 'pending' }), SecurityEvent.countDocuments({ acknowledgedAt: null })
  ]);
  res.json({ stats: { products, categories, users, orders, pendingOrders: pending, securityAlerts: alerts } });
});
router.get('/alerts', async (req, res) => res.json({ alerts: await SecurityEvent.find().sort({ createdAt: -1 }).limit(100).lean() }));
router.patch('/alerts/:id/ack', requireRoles('admin','manager'), async (req, res) => {
  const event = await SecurityEvent.findById(req.params.id).lean(); if (!event) return res.status(404).json({ error: 'Alert not found' });
  const updated = securePayload({ ...event, acknowledgedAt: new Date(), acknowledgedBy: req.user._id });
  await SecurityEvent.replaceOne({ _id: event._id }, updated);
  await createAudit({ actorId: req.user._id, action: 'ack_security_alert', collection: 'security_events', documentId: event._id, ip: req.ip });
  res.json({ ok: true });
});
router.get('/audit', async (req, res) => res.json({ logs: await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean() }));
router.get('/users', async (req, res) => res.json({ users: await User.find().sort({ createdAt: -1 }).limit(200).lean() }));
router.patch('/users/:id/role', requireRoles('admin'), async (req, res) => {
  const allowed = ['customer','admin','manager','staff']; const role = String(req.body.role);
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const user = await User.findById(req.params.id).lean(); if (!user) return res.status(404).json({ error: 'User not found' });
  const updated = securePayload({ ...user, role, updatedAt: new Date() });
  await User.replaceOne({ _id: user._id }, updated);
  await createAudit({ actorId: req.user._id, action: 'change_role', collection: 'users', documentId: user._id, ip: req.ip, meta: { role } });
  res.json({ ok: true });
});
export default router;
