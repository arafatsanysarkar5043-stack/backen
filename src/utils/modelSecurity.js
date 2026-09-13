import { digestDocument } from './security.js';

export function securePayload(payload) {
  const plain = typeof payload.toObject === 'function' ? payload.toObject({ depopulate: true }) : payload;
  return { ...plain, security: { digest: digestDocument(plain), algorithm: 'HMAC-SHA256' } };
}

export function verifyPayload(payload) {
  if (!payload?.security?.digest) return false;
  return payload.security.digest === digestDocument(payload);
}
