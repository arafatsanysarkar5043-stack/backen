import mongoose from 'mongoose';
import { securitySchema } from './security.js';
const schema = new mongoose.Schema({
  actorId: mongoose.Schema.Types.ObjectId,
  action: { type: String, required: true },
  collection: { type: String, required: true },
  documentId: String,
  meta: mongoose.Schema.Types.Mixed,
  ip: String,
  createdAt: { type: Date, default: Date.now, index: true },
  previousDigest: String
}, { versionKey: false });
schema.add({ security: { type: securitySchema, required: true } });
export default mongoose.model('AuditLog', schema);
