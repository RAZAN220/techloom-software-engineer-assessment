import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const createCart = async (req, res) => {
  try { res.status(201).json(await Cart.create({ items: [] })); }
  catch (error) { res.status(400).json({ message: error.message }); }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json(cart);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Quantity must be a positive integer' });
    const [product, cart] = await Promise.all([Product.findById(productId), Cart.findById(req.params.id)]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const item = cart.items.find(entry => entry.productId.toString() === productId);
    const requestedQuantity = (item?.quantity || 0) + quantity;
    if (product.stock < requestedQuantity) return res.status(400).json({ message: `Only ${product.stock} units available` });
    if (item) item.quantity = requestedQuantity;
    else cart.items.push({ productId: product._id, name: product.name, price: product.price, quantity });
    res.json(await cart.save());
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
    res.json(await cart.save());
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: 'Quantity must be a positive integer' });
    const [cart, product] = await Promise.all([Cart.findById(req.params.id), Product.findById(req.params.productId)]);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ message: `Only ${product.stock} units available` });
    const item = cart.items.find(entry => entry.productId.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });
    item.quantity = quantity;
    res.json(await cart.save());
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = [];
    res.json(await cart.save());
  } catch (error) { res.status(400).json({ message: error.message }); }
};