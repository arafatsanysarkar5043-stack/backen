import { Router } from 'express';
import { z } from 'zod';
import Category from '../models/Category.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { securePayload } from '../utils/modelSecurity.js';
import { createAudit } from '../utils/audit.js';

const router = Router();
const body = z.object({ name: z.string().min(1).max(100), slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/), parentId: z.string().nullable().optional(), description: z.string().max(5000).optional(), seo: z.object({ title: z.string().max(200).optional(), description: z.string().max(320).optional(), keywords: z.array(z.string()).max(50).optional() }).optional(), active: z.boolean().optional() });

router.get('/', async (req, res) => res.json({ categories: await Category.find({ active: true }).sort({ name: 1 }).lean() }));
router.post('/', auth, requireRoles('admin','manager'), validate(body), async (req, res) => {
  const data = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
  const cat = await Category.create(securePayload(data));
  await createAudit({ actorId: req.user._id, action: 'create', collection: 'categories', documentId: cat._id, ip: req.ip });
  res.status(201).json({ category: cat });
});
router.put('/:id', auth, requireRoles('admin','manager'), validate(body.partial()), async (req, res) => {
  const cat = await Category.findById(req.params.id).lean();
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const updated = { ...cat, ...req.body, updatedAt: new Date() };
  await Category.replaceOne({ _id: cat._id }, securePayload(updated));
  await createAudit({ actorId: req.user._id, action: 'update', collection: 'categories', documentId: cat._id, ip: req.ip });
  res.json({ category: await Category.findById(cat._id).lean() });
});
export default router;
