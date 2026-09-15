import Order from '../models/Order.js';
import { createOrderFromCart, checkoutOrder, payOrder, cancelOrder, refundOrder } from '../services/orderService.js';

export const createOrder = async (req, res) => {
  try {
    const cartId = req.params.id || req.body.cartId;
    res.status(201).json(await createOrderFromCart(cartId, req.body.idempotencyKey));
  }
  catch (error) { res.status(400).json({ message: error.message }); }
};

export const checkout = async (req, res) => {
  try { res.json(await checkoutOrder(req.params.id)); }
  catch (error) { res.status(400).json({ message: error.message }); }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const getAllOrders = async (req, res) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
};

export const cancel = async (req, res) => {
  try { res.json(await cancelOrder(req.params.id)); }
  catch (error) { res.status(400).json({ message: error.message }); }
};

export const payment = async (req, res) => {
  try {
    const order = await payOrder(req.params.id, req.body.outcome, req.body.idempotencyKey);
    res.json(order);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

export const refund = async (req, res) => {
  try { res.json(await refundOrder(req.params.id)); }
  catch (error) { res.status(400).json({ message: error.message }); }
};