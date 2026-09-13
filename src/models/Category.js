import mongoose from 'mongoose';
import { securitySchema } from './security.js';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  description: { type: String, default: '' },
  seo: { title: String, description: String, keywords: [String] },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });
schema.add({ security: { type: securitySchema, required: true } });
export default mongoose.model('Category', schema);
