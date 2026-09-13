import AuditLog from '../models/AuditLog.js';
import { digestDocument } from './security.js';

export async function createAudit({ actorId = null, action, collection, documentId = null, meta = {}, ip = null }) {
  const previous = await AuditLog.findOne().sort({ createdAt: -1 }).lean();
  const doc = {
    actorId,
    action,
    collection,
    documentId: documentId ? String(documentId) : null,
    meta,
    ip,
    createdAt: new Date(),
    previousDigest: previous?.security?.digest || null
  };
  doc.security = { digest: digestDocument(doc) };
  await AuditLog.create(doc);
}
