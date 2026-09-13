import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { canonicalize } from './canonical.js';

export function digestDocument(doc) {
  const raw = JSON.stringify(canonicalize(doc));
  return crypto.createHmac('sha256', env.DB_PEPPER).update(raw).digest('hex');
}

export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d', issuer: 'zafriva' });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { issuer: 'zafriva' });
}

export function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function randomId() {
  return crypto.randomBytes(16).toString('hex');
}
