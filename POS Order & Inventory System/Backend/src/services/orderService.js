import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Reservation from '../models/Reservation.js';
import { createReservation, releaseReservation } from './reservationService.js';
import { processPayment } from './paymentService.js';
import { confirmStockSale, restoreStockSale } from './inventoryService.js';
import { assertTransition } from '../utils/constants.js';

export const createOrderFromCart = async (cartId, idempotencyKey) => {
  if (!idempotencyKey) throw new Error('Idempotency key is required');
  const existing = await Order.findOne({ $or: [{ idempotencyKey }, { cartId }] });
  if (existing) return existing;
  try {
    const cart = await Cart.findOneAndUpdate(
      { _id: cartId, status: 'active' },
      { status: 'checked_out' },
      { new: true }
    );
    if (!cart) {
      const duplicate = await Order.findOne({ cartId });
      if (duplicate) return duplicate;
      throw new Error('Cart not found or already checked out');
    }
    if (!cart.items.length) throw new Error('Cart is empty');
    const totalAmount = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    const [order] = await Order.create([{
      orderNumber: `ORD-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`,
      cartId: cart._id,
      items: cart.items.map(item => ({ productId: item.productId, name: item.name, price: item.price, quantity: item.quantity })),
      totalAmount,
      idempotencyKey
    }]);
    return order;
  } catch (error) {
    if (error.code === 11000) return Order.findOne({ $or: [{ idempotencyKey }, { cartId }] });
    throw error;
  }
};

export const checkoutOrder = async orderId => {
  assertTransition('PENDING', 'RESERVING');
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, status: 'PENDING' },
    { status: 'RESERVING' },
    { new: true }
  );
  if (!claimed) {
    const current = await Order.findById(orderId);
    if (!current) throw new Error('Order not found');
    if (['RESERVED', 'PAID'].includes(current.status)) return current;
    throw new Error(`Cannot checkout order in ${current.status} state`);
  }
  try {
    await createReservation(claimed._id, claimed.items);
    return Order.findById(orderId);
  } catch (error) {
    await Order.findOneAndUpdate({ _id: orderId, status: 'RESERVING' }, { status: 'FAILED', failedAt: new Date() });
    throw error;
  }
};

export const payOrder = async (orderId, outcome = 'SUCCESS', idempotencyKey = uuidv4()) => {
  const normalizedOutcome = String(outcome).toUpperCase();
  if (!['SUCCESS', 'FAILURE', 'TIMEOUT'].includes(normalizedOutcome)) throw new Error('Outcome must be SUCCESS, FAILURE, or TIMEOUT');
  const existingPayment = await Payment.findOne({ $or: [{ orderId }, { idempotencyKey }] });
  if (existingPayment) return Order.findById(orderId);
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: 'RESERVED', paymentStatus: 'pending' },
    { paymentStatus: 'processing' },
    { new: true }
  );
  if (!order) {
    const current = await Order.findById(orderId);
    if (!current) throw new Error('Order not found');
    if (['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(current.status)) return current;
    throw new Error(`Order is not payable in ${current.status} state`);
  }
  const payment = await processPayment(orderId, order.totalAmount, normalizedOutcome);
  if (payment.status === 'success') {
    assertTransition('RESERVED', 'PAID');
    const confirmedItems = [];
    try {
      for (const item of order.items) { await confirmStockSale(item.productId, item.quantity); confirmedItems.push(item); }
      await Payment.create({ orderId, idempotencyKey, outcome: normalizedOutcome, status: 'success' });
      await Order.findOneAndUpdate({ _id: orderId, status: 'RESERVED', paymentStatus: 'processing' }, {
        status: 'PAID', paymentStatus: 'success', paymentId: payment.paymentId, paidAt: new Date()
      });
      await Reservation.findByIdAndUpdate(order.reservationId, { status: 'completed' });
    } catch (error) {
      for (const item of confirmedItems) await restoreStockSale(item.productId, item.quantity);
      await Payment.deleteOne({ orderId, idempotencyKey, status: 'success' });
      await Order.findOneAndUpdate({ _id: orderId, paymentStatus: 'processing' }, { paymentStatus: 'pending' });
      throw error;
    }
  } else {
    assertTransition('RESERVED', payment.status === 'timeout' ? 'EXPIRED' : 'FAILED');
    await Payment.create({ orderId, idempotencyKey, outcome: normalizedOutcome, status: payment.status });
    await releaseReservation(order.reservationId, payment.status === 'timeout' ? 'expired' : 'released', payment.status === 'timeout' ? 'EXPIRED' : 'FAILED');
    await Order.findOneAndUpdate({ _id: orderId, paymentStatus: 'processing' }, {
      paymentStatus: payment.status, paymentId: payment.paymentId,
      ...(payment.status === 'timeout' ? { status: 'EXPIRED', expiredAt: new Date() } : { status: 'FAILED', failedAt: new Date() })
    });
  }
  return Order.findById(orderId);
};

export const cancelOrder = async orderId => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.status === 'PAID') throw new Error('Paid orders require a refund workflow');
  if (order.status !== 'RESERVED') throw new Error(`Cannot cancel order in ${order.status} state`);
  assertTransition('RESERVED', 'CANCELLED');
  await releaseReservation(order.reservationId, 'released', 'CANCELLED');
  return Order.findById(orderId);
};

export const refundOrder = async orderId => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: 'PAID', refundStatus: 'pending' },
    { refundStatus: 'processing' },
    { new: true }
  );
  if (!order) {
    const current = await Order.findById(orderId);
    if (!current) throw new Error('Order not found');
    if (current.status === 'CANCELLED' && current.refundStatus === 'processed') return current;
    throw new Error(`Cannot refund order in ${current.status} state`);
  }
  try {
    for (const item of order.items) await restoreStockSale(item.productId, item.quantity);
    return Order.findOneAndUpdate({ _id: orderId, refundStatus: 'processing' }, {
      status: 'CANCELLED', refundStatus: 'processed', refundId: `REF-${uuidv4().slice(0, 8).toUpperCase()}`, refundedAt: new Date(), cancelledAt: new Date()
    }, { new: true });
  } catch (error) {
    await Order.findOneAndUpdate({ _id: orderId, refundStatus: 'processing' }, { refundStatus: 'pending' });
    throw error;
  }
};
