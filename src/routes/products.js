import { Router } from 'express';
import { z } from 'zod';
import Product from '../models/Product.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { securePayload } from '../utils/modelSecurity.js';
import { createAudit } from '../utils/audit.js';

const router = Router();
const variant = z.object({ sku: z.string().min(1).max(80), barcode: z.string().max(100).optional(), name: z.string().max(100).optional(), options: z.record(z.string(), z.string()).optional(), price: z.number().nonnegative(), compareAtPrice: z.number().nonnegative().optional(), stock: z.number().int().nonnegative().default(0), imageIds: z.array(z.string()).optional() });
const body = z.object({ name: z.string().min(1).max(200), slug: z.string().min(1).max(220).regex(/^[a-z0-9-]+$/), shortDescription: z.string().max(500).optional(), description: z.string().max(30000).optional(), brand: z.string().max(100).optional(), categoryIds: z.array(z.string()).max(20).default([]), tags: z.array(z.string()).max(100).default([]), images: z.array(z.string()).max(15).default([]), videoUrl: z.string().url().or(z.literal('')).optional(), productType: z.enum(['simple','variable','combo']).default('simple'), variants: z.array(variant).max(100).default([]), comboItems: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).max(50).default([]), seo: z.object({ title: z.string().max(200).optional(), description: z.string().max(320).optional(), keywords: z.array(z.string()).max(100).optional(), canonicalUrl: z.string().url().optional(), noIndex: z.boolean().optional() }).optional(), delivery: z.object({ advancedDeliveryFee: z.number().nonnegative().default(0), advancedPaymentRequired: z.boolean().default(false), codAllowed: z.boolean().default(true) }).default({ advancedDeliveryFee: 0, advancedPaymentRequired: false, codAllowed: true }), active: z.boolean().optional() });

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = { active: true };
  if (q) filter.$or = [{ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { tags: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }];
  const products = await Product.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
  res.json({ products });
});
router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});
router.post('/', auth, requireRoles('admin','manager'), validate(body), async (req, res) => {
  const data = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
  const product = await Product.create(securePayload(data));
  await createAudit({ actorId: req.user._id, action: 'create', collection: 'products', documentId: product._id, ip: req.ip });
  res.status(201).json({ product });
});
router.put('/:id', auth, requireRoles('admin','manager'), validate(body.partial()), async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const updated = { ...product, ...req.body, updatedAt: new Date() };
  await Product.replaceOne({ _id: product._id }, securePayload(updated));
  await createAudit({ actorId: req.user._id, action: 'update', collection: 'products', documentId: product._id, ip: req.ip });
  res.json({ product: await Product.findById(product._id).lean() });
});
router.delete('/:id', auth, requireRoles('admin'), async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const updated = { ...product, active: false, updatedAt: new Date() };
  await Product.replaceOne({ _id: product._id }, securePayload(updated));
  await createAudit({ actorId: req.user._id, action: 'archive', collection: 'products', documentId: product._id, ip: req.ip });
  res.json({ ok: true });
});
export default router;
