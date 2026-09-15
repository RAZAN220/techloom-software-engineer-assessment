export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RESERVING: 'RESERVING',
  RESERVED: 'RESERVED',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
});

export const RESERVATION_TIMEOUT_MINUTES = 5;

const transitions = {
  PENDING: ['RESERVING', 'CANCELLED', 'FAILED'],
  RESERVING: ['RESERVED', 'FAILED'],
  RESERVED: ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED'],
  PAID: ['CANCELLED'],
  FAILED: [],
  EXPIRED: [],
  CANCELLED: []
};

export const canTransition = (from, to) => transitions[from]?.includes(to) || false;

export const assertTransition = (from, to) => {
  if (!canTransition(from, to)) throw new Error(`Invalid order transition: ${from} -> ${to}`);
};