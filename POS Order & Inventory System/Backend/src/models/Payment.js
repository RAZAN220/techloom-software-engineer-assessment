import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  idempotencyKey: { type: String, required: true, unique: true },
  outcome: { type: String, enum: ['SUCCESS', 'FAILURE', 'TIMEOUT'], required: true },
  status: { type: String, enum: ['success', 'failed', 'timeout'], required: true }
}, { timestamps: true });

export default mongoose.model('Payment', PaymentSchema);