import Reservation from '../models/Reservation.js';
import Order from '../models/Order.js';
import { reserveStock, releaseStock } from './inventoryService.js';
import { RESERVATION_TIMEOUT_MINUTES, assertTransition } from '../utils/constants.js';

const timeoutMs = (Number(process.env.RESERVATION_TIMEOUT_MINUTES) || RESERVATION_TIMEOUT_MINUTES) * 60 * 1000;

export const createReservation = async (orderId, items) => {
  const reservedItems = [];
  let reservation = null;
  try {
    for (const item of items) {
      await reserveStock(item.productId, item.quantity);
      reservedItems.push(item);
    }
    const expiresAt = new Date(Date.now() + timeoutMs);
    reservation = await Reservation.create({
      orderId,
      items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      expiresAt
    });
    assertTransition('RESERVING', 'RESERVED');
    const order = await Order.findOneAndUpdate(
      { _id: orderId, status: 'RESERVING' },
      { status: 'RESERVED', reservationId: reservation._id, reservedAt: new Date(), reservationExpiresAt: expiresAt },
      { new: true }
    );
    if (!order) throw new Error('Order is no longer available for reservation');
    return reservation;
  } catch (error) {
    if (reservation) await Reservation.deleteOne({ _id: reservation._id, status: 'active' });
    for (const item of reservedItems) await releaseStock(item.productId, item.quantity);
    throw error;
  }
};

export const releaseReservation = async (reservationId, reason = 'released', finalStatus = null) => {
  const reservation = await Reservation.findOneAndUpdate(
    { _id: reservationId, status: 'active' },
    { status: reason },
    { new: true }
  );
  if (!reservation) return null;
  for (const item of reservation.items) await releaseStock(item.productId, item.quantity);
  const status = finalStatus || (reason === 'expired' ? 'EXPIRED' : reason === 'completed' ? 'PAID' : 'CANCELLED');
  assertTransition('RESERVED', status);
  const updateFields = { status };
  if (status === 'EXPIRED') updateFields.expiredAt = new Date();
  else if (status === 'CANCELLED') updateFields.cancelledAt = new Date();
  else if (status === 'FAILED') updateFields.failedAt = new Date();

  await Order.findOneAndUpdate(
    { _id: reservation.orderId, status: { $in: ['RESERVED', 'RESERVING'] } },
    updateFields
  );
  return reservation;
};

export const processExpiredReservations = async () => {
  const expired = await Reservation.find({ status: 'active', expiresAt: { $lt: new Date() } }, { _id: 1 });
  let released = 0;
  for (const reservation of expired) {
    if (await releaseReservation(reservation._id, 'expired', 'EXPIRED')) released += 1;
  }
  return released;
};
