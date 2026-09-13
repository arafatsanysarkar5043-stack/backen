import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { auth, optionalAuth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { securePayload } from '../utils/modelSecurity.js';
import { createAudit } from '../utils/audit.js';

const router = Router();
const item = z.object({ productId: z.string(), variantId: z.string().optional(), quantity: z.number().int().positive().max(100) });
const body = z.object({ customer: z.object({ name: z.string().min(2).max(100), email: z.string().email().optional().or(z.literal('')), phone: z.string().min(5).max(30), address: z.string().max(500), location: z.string().max(200).optional() }), items: z.array(item).min(1).max(50), deliveryFee: z.number().nonnegative().default(0), discount: z.number().nonnegative().default(0), payment: z.object({ method: z.enum(['cod','bkash','nagad','rocket']), amount: z.number().nonnegative().default(0), txId: z.string().max(100).optional(), senderNumber: z.string().max(30).optional() }).optional() });

function makeOrderNumber() { return `ZF-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; }

router.post('/', optionalAuth, validate(body), async (req, res) => {
  let subtotal = 0;
  const items = [];
  for (const line of req.body.items) {
    const p = await Product.findOne({ _id: line.productId, active: true }).lean();
    if (!p) return res.status(400).json({ error: 'Product unavailable' });
    let source = p.variants?.find(v => String(v._id) === line.variantId);
    if (!source) source = p.variants?.[0];
    if (!source) return res.status(400).json({ error: `No sellable variant for ${p.name}` });
    if (source.stock < line.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
    const total = source.price * line.quantity;
    subtotal += total;
    items.push({ productId: p._id, variantId: source._id, name: p.name, sku: source.sku, quantity: line.quantity, unitPrice: source.price, total, imageId: p.images?.[0] });
  }
  const grandTotal = Math.max(0, subtotal + req.body.deliveryFee - req.body.discount);
  const paymentAmount = Math.min(req.body.payment?.amount || 0, grandTotal);
  const payment = req.body.payment ? { method: req.body.payment.method, amount: paymentAmount, status: req.body.payment.method === 'cod' ? 'pending' : 'submitted', txId: req.body.payment.txId, senderNumber: req.body.payment.senderNumber } : { method: 'cod', amount: 0, status: 'pending' };
  if (items.some(i => false)) return res.status(400).json({ error: 'Invalid order' });
  const base = { orderNumber: makeOrderNumber(), userId: null, customer: req.body.customer, items, subtotal, deliveryFee: req.body.deliveryFee, discount: req.body.discount, grandTotal, status: 'pending', payments: [payment], statusHistory: [{ status: 'pending', at: new Date() }], createdAt: new Date(), updatedAt: new Date() };
  if (req.user) base.userId = req.user._id;
  const order = await Order.create(securePayload(base));
  await createAudit({ actorId: req.user?._id || null, action: 'create_order', collection: 'orders', documentId: order._id, ip: req.ip, meta: { orderNumber: order.orderNumber } });
  res.status(201).json({ order: { id: order._id, orderNumber: order.orderNumber, grandTotal: order.grandTotal, status: order.status } });
});

router.get('/mine', auth, async (req, res) => res.json({ orders: await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).select('-payments.txId -payments.senderNumber').lean() }));
router.get('/', auth, requireRoles('admin','manager','staff'), async (req, res) => res.json({ orders: await Order.find().sort({ createdAt: -1 }).limit(200).lean() }));

router.patch('/:id/status', auth, requireRoles('admin','manager'), async (req, res) => {
  const allowed = ['pending','confirmed','processing','packed','shipped','delivered','cancelled','return_requested','returned','refunded','failed'];
  const status = String(req.body.status);
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = await Order.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const updated = { ...order, status, statusHistory: [...(order.statusHistory || []), { status, at: new Date(), by: req.user._id }], updatedAt: new Date() };
  await Order.replaceOne({ _id: order._id }, securePayload(updated));
  await createAudit({ actorId: req.user._id, action: `order_status_${status}`, collection: 'orders', documentId: order._id, ip: req.ip });
  res.json({ ok: true });
});

router.patch('/:id/payment', auth, requireRoles('admin','manager'), async (req, res) => {
  const schema = z.object({ paymentId: z.string(), status: z.enum(['verified','failed','cancelled','refunded','partially_refunded']), note: z.string().max(500).optional() });
  const parsed = schema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Invalid payment update' });
  const order = await Order.findById(req.params.id).lean(); if (!order) return res.status(404).json({ error: 'Order not found' });
  const payments = (order.payments || []).map(p => String(p._id) === parsed.data.paymentId ? { ...p, status: parsed.data.status, verifiedBy: req.user._id, verifiedAt: new Date() } : p);
  const status = parsed.data.status === 'verified' && order.status === 'pending' ? 'confirmed' : order.status;
  const updated = { ...order, payments, status, statusHistory: status !== order.status ? [...(order.statusHistory || []), { status, at: new Date(), by: req.user._id, note: parsed.data.note }] : order.statusHistory, updatedAt: new Date() };
  await Order.replaceOne({ _id: order._id }, securePayload(updated));
  await createAudit({ actorId: req.user._id, action: `payment_${parsed.data.status}`, collection: 'orders', documentId: order._id, ip: req.ip });
  res.json({ ok: true });
});
export default router;
