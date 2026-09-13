export function canonicalize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value instanceof Map) {
    return Object.fromEntries([...value.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([k, v]) => [k, canonicalize(v)]));
  }
  if (typeof value === 'object') {
    if (value._bsontype === 'ObjectId' || value._bsontype === 'Decimal128') return value.toString();
    if (typeof value.toHexString === 'function') return value.toHexString();
    const plain = typeof value.toObject === 'function' ? value.toObject({ depopulate: true }) : value;
    const out = {};
    for (const key of Object.keys(plain).sort()) {
      if (key === 'security' || key === '__v' || key === '_id') continue;
      out[key] = canonicalize(plain[key]);
    }
    return out;
  }
  return value;
}
