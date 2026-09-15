# POS Inventory Backend

Install dependencies with `npm install`, configure `.env`, then run `npm run dev`.

The inventory reservation uses an atomic `stock >= quantity` update. Reservations expire after five minutes and are released by the cron job.