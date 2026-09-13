import mongoose from 'mongoose';
import { securitySchema } from './security.js';

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  barcode: String,
  name: String,
  options: { type: Map, of: String, default: {} },
  price: { type: Number, min: 0, required: true },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, min: 0, default: 0 },
  imageIds: [{ type: mongoose.Schema.Types.ObjectId }]
}, { _id: true });

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  brand: { type: String, default: '' },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
  tags: [{ type: String, index: true }],
  images: [{ type: mongoose.Schema.Types.ObjectId }],
  videoUrl: { type: String, default: '' },
  productType: { type: String, enum: ['simple', 'variable', 'combo'], default: 'simple' },
  variants: [variantSchema],
  comboItems: [{ productId: mongoose.Schema.Types.ObjectId, quantity: { type: Number, min: 1, default: 1 } }],
  seo: {
    title: String,
    description: String,
    keywords: [String],
    canonicalUrl: String,
    noIndex: { type: Boolean, default: false }
  },
  delivery: {
    advancedDeliveryFee: { type: Number, min: 0, default: 0 },
    advancedPaymentRequired: { type: Boolean, default: false },
    codAllowed: { type: Boolean, default: true }
  },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: true });
schema.add({ security: { type: securitySchema, required: true } });
export default mongoose.model('Product', schema);
