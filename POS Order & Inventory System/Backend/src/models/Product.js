import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },        // Available stock
  reserved: { type: Number, required: true, min: 0, default: 0 },     // Reserved stock (locked)
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Virtual: total stock = available + reserved
ProductSchema.virtual('totalStock').get(function () {
  return this.stock + this.reserved;
});

ProductSchema.virtual('availableStock').get(function () {
  return this.stock;
});

ProductSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', ProductSchema);