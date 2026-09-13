import mongoose from 'mongoose';

export const securitySchema = new mongoose.Schema({
  digest: { type: String, required: true, immutable: true },
  algorithm: { type: String, enum: ['HMAC-SHA256'], default: 'HMAC-SHA256', immutable: true }
}, { _id: false, versionKey: false });
