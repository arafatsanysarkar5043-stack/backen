import { verifyToken } from '../utils/security.js';
import User from '../models/User.js';

export async function optionalAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return next();
    const payload = verifyToken(header.slice(7));
    const user = await User.findById(payload.sub).lean();
    if (user?.active) req.user = user;
  } catch {}
  next();
}

export async function auth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid session' });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: 'Invalid session' }); }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
