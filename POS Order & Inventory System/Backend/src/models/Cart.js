import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  items: [CartItemSchema],
  status: { 
    type: String, 
    enum: ['active', 'checked_out', 'abandoned'], 
    default: 'active' 
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Cart', CartSchema);