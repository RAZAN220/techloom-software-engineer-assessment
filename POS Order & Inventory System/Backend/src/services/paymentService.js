import { v4 as uuidv4 } from 'uuid';

export const processPayment = async (orderId, amount, requestedOutcome = null) => {
  const delay = 25;
  await new Promise(resolve => setTimeout(resolve, delay));
  const random = requestedOutcome === 'SUCCESS' ? 0 : requestedOutcome === 'FAILURE' ? 0.8 : requestedOutcome === 'TIMEOUT' ? 0.95 : Math.random();
  const paymentId = `PAY-${uuidv4().slice(0, 8).toUpperCase()}`;
  if (random < 0.7) return { success: true, status: 'success', paymentId, amount };
  if (random < 0.9) return { success: false, status: 'failed', paymentId, amount };
  return { success: false, status: 'timeout', paymentId, amount };
};