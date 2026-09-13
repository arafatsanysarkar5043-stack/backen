import mongoose from 'mongoose';
import { securitySchema } from './security.js';

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, trim: true, maxlength: 100 },
  phone: { type: String, trim: true, maxlength: 30 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin', 'manager', 'staff'], default: 'customer', index: true },
  permissions: [{ type: String }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });
schema.add({ security: { type: securitySchema, required: true } });
schema.pre('save', function(next) { this.updatedAt = new Date(); next(); });
export default mongoose.model('User', schema);
