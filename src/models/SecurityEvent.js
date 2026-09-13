import mongoose from 'mongoose';
import { securitySchema } from './security.js';
const schema = new mongoose.Schema({
  severity: { type: String, enum: ['high', 'critical'], default: 'critical' },
  eventType: { type: String, required: true },
  collection: String,
  documentId: String,
  expected: String,
  actual: String,
  message: String,
  createdAt: { type: Date, default: Date.now, index: true },
  acknowledgedAt: Date,
  acknowledgedBy: mongoose.Schema.Types.ObjectId
}, { versionKey: false });
schema.add({ security: { type: securitySchema, required: true } });
export default mongoose.model('SecurityEvent', schema);
