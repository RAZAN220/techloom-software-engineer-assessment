import Product from '../models/Product.js';

export const reserveStock = async (productId, quantity, session = null) => {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity, reserved: quantity } },
    { new: true, session }
  );

  if (!product) {
    const exists = await Product.findById(productId).session(session);
    if (!exists) throw new Error(`Product ${productId} not found`);
    throw new Error(`Insufficient stock for "${exists.name}". Available: ${exists.stock}, Requested: ${quantity}`);
  }
  return product;
};

export const releaseStock = async (productId, quantity, session = null) => {
  const product = await Product.findOneAndUpdate(
  { _id: productId, reserved: { $gte: quantity } },
  { $inc: { stock: quantity, reserved: -quantity } },
  { new: true, session }
  );
  if (!product) throw new Error(`Unable to release ${quantity} reserved units for product ${productId}`);
  return product;
};

export const confirmStockSale = async (productId, quantity, session = null) => {
  const product = await Product.findOneAndUpdate(
  { _id: productId, reserved: { $gte: quantity } },
  { $inc: { reserved: -quantity } },
  { new: true, session }
  );
  if (!product) throw new Error(`Unable to confirm ${quantity} reserved units for product ${productId}`);
  return product;
};

export const restoreStockSale = async (productId, quantity) => {
  const product = await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }, { new: true });
  if (!product) throw new Error(`Unable to restore sold units for product ${productId}`);
  return product;
};

export const getAllStockLevels = () => Product.find({}, 'name price stock reserved').lean();