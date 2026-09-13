import mongoose from 'mongoose';
import { securitySchema } from './security.js';
const schema = new mongoose.Schema({
  originalName: String,
  mimeType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });
schema.add({ security: { type: securitySchema, required: true } });
export default mongoose.model('Image', schema);
