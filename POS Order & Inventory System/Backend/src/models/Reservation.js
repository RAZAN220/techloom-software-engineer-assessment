import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    _id: false
  }],
  expiresAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'released'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

ReservationSchema.index({ orderId: 1 }, { unique: true });

export default mongoose.model('Reservation', ReservationSchema);