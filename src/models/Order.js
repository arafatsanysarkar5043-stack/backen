import mongoose from 'mongoose';
import { securitySchema } from './security.js';
const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  variantId: mongoose.Schema.Types.ObjectId,
  name: String,
  sku: String,
  quantity: { type: Number, min: 1, required: true },
  unitPrice: { type: Number, min: 0, required: true },
  total: { type: Number, min: 0, required: true },
  imageId: mongoose.Schema.Types.ObjectId
}, { _id: false });
const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['cod', 'bkash', 'nagad', 'rocket'], required: true },
  status: { type: String, enum: ['pending', 'submitted', 'verified', 'failed', 'cancelled', 'partially_paid', 'paid', 'refunded', 'partially_refunded'], default: 'pending' },
  amount: { type: Number, min: 0, default: 0 },
  txId: String,
  senderNumber: String,
  proofImageId: mongoose.Schema.Types.ObjectId,
  verifiedBy: mongoose.Schema.Types.ObjectId,
  verifiedAt: Date
}, { _id: true });
const schema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  customer: { name: { type: String, required: true }, email: String, phone: { type: String, required: true }, address: String, location: String },
  items: { type: [itemSchema], validate: v => v.length > 0 },
  subtotal: { type: Number, min: 0, required: true },
  deliveryFee: { type: Number, min: 0, default: 0 },
  discount: { type: Number, min: 0, default: 0 },
  grandTotal: { type: Number, min: 0, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded', 'failed'], default: 'pending', index: true },
  payments: [paymentSchema],
  courier: { name: String, trackingNumber: String, trackingUrl: String, status: String },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now }, by: mongoose.Schema.Types.ObjectId, note: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });
schema.add({ security: { type: securitySchema, required: true } });
export default mongoose.model('Order', schema);
