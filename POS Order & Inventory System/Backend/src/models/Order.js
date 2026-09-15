import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  quantity: Number
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  
  // Order Status Lifecycle
  status: {
    type: String,
    enum: [
      'PENDING',      // Order created, no reservation yet
      'RESERVING',    // Checkout has claimed this order
      'RESERVED',     // Stock reserved, waiting for payment
      'PAID',         // Payment successful
      'FAILED',       // Payment failed
      'CANCELLED',    // User cancelled
      'EXPIRED'       // Reservation expired (5 min timeout)
    ],
    default: 'PENDING'
  },
  
  // Idempotency - prevent duplicate orders
  idempotencyKey: { type: String, unique: true, sparse: true },
  
  // Payment
  paymentId: String,
  paymentStatus: { type: String, enum: ['pending', 'processing', 'success', 'failed', 'timeout'], default: 'pending' },
  
  // Reservation Reference
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  
  // Timestamps
  reservedAt: Date,
  reservationExpiresAt: Date,
  paidAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  expiredAt: Date,
  refundStatus: { type: String, enum: ['pending', 'processing', 'processed'], default: 'pending' },
  refundId: String,
  refundedAt: Date
}, { timestamps: true });

OrderSchema.index({ cartId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Order', OrderSchema);