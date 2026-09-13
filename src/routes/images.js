import { Router } from 'express';
import multer from 'multer';
import Image from '../models/Image.js';
import { env } from '../config/env.js';
import { auth, requireRoles } from '../middleware/auth.js';
import { securePayload } from '../utils/modelSecurity.js';
import { createAudit } from '../utils/audit.js';

const router = Router();
const upload = multer({ limits: { fileSize: env.MAX_IMAGE_BYTES }, fileFilter: (req, file, cb) => cb(null, ['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)) });
router.post('/', auth, requireRoles('admin','manager'), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const data = { originalName: req.file.originalname.slice(0, 200), mimeType: req.file.mimetype, data: req.file.buffer, size: req.file.size, createdAt: new Date() };
  const image = await Image.create(securePayload(data));
  await createAudit({ actorId: req.user._id, action: 'upload', collection: 'images', documentId: image._id, ip: req.ip, meta: { size: image.size, mimeType: image.mimeType } });
  res.status(201).json({ image: { id: image._id, mimeType: image.mimeType, size: image.size } });
});
router.get('/:id', async (req, res) => {
  const image = await Image.findById(req.params.id).lean();
  if (!image) return res.status(404).end();
  res.set('Content-Type', image.mimeType).set('Cache-Control', 'public, max-age=31536000, immutable').send(image.data);
});
export default router;
