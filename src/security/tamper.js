import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';
import SecurityEvent from '../models/SecurityEvent.js';
import Image from '../models/Image.js';
import { verifyPayload, securePayload } from '../utils/modelSecurity.js';

const targets = [
  ['users', User], ['categories', Category], ['products', Product], ['orders', Order], ['audit_logs', AuditLog], ['security_events', SecurityEvent], ['images', Image]
];

export async function runTamperCheck() {
  const findings = [];
  for (const [name, Model] of targets) {
    const cursor = Model.find({}).lean().cursor();
    for await (const doc of cursor) {
      if (!verifyPayload(doc)) findings.push({ collection: name, documentId: String(doc._id), expected: securePayload(doc).security.digest, actual: doc.security?.digest || null });
    }
  }
  for (const f of findings) {
    const exists = await SecurityEvent.findOne({ eventType: 'DATA_TAMPERING', collection: f.collection, documentId: f.documentId, acknowledgedAt: null });
    if (!exists) {
      const event = { severity: 'critical', eventType: 'DATA_TAMPERING', collection: f.collection, documentId: f.documentId, expected: f.expected, actual: f.actual, message: `Tamper detected in ${f.collection}/${f.documentId}`, createdAt: new Date() };
      await SecurityEvent.create(securePayload(event));
    }
  }
  return { ok: findings.length === 0, findings };
}
