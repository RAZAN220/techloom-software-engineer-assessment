import cron from 'node-cron';
import { processExpiredReservations } from '../services/reservationService.js';

export const startExpiryJob = () => cron.schedule('* * * * *', async () => {
  try { await processExpiredReservations(); }
  catch (error) { console.error('Reservation expiry job failed:', error); }
});