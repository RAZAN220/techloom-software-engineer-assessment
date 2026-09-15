# POS Order & Inventory System

Concurrency-safe POS inventory, carts, five-minute stock reservations, mock payments, and order management.

## Setup

Backend:

```powershell
cd "POS Order & Inventory System\Backend"
npm install
npm run dev
```

The backend reads `MONGO_URI` from `.env`; the current local value is `mongodb://localhost:27017/`. It listens on port `5000`.

Frontend:

```powershell
cd "POS Order & Inventory System\Frontend"
npm install
npm start
```

Set `REACT_APP_API_URL` in the frontend `.env` when the API is not at `http://localhost:5000/api`.

## Architecture

Express routes call controllers, which delegate checkout and inventory rules to services. MongoDB Product documents maintain available `stock` and `reserved` quantities. Reservation uses an atomic conditional update with `stock >= quantity`, so concurrent requests cannot oversell. The local standalone MongoDB setup uses atomic updates and compensating releases; replica-set deployments can additionally wrap multi-document flows in transactions.

## API

- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id`
- `GET /api/products/stock`
- `POST /api/carts`, `GET /api/carts/:id`
- `POST/PUT/DELETE /api/carts/:id/items` and `/api/carts/:id/items/:productId`
- `POST /api/carts/:id/checkout` or `POST /api/orders` with `cartId` and `idempotencyKey`
- `POST /api/orders/:id/checkout` reserves stock for five minutes
- `POST /api/orders/:id/payment` with `{ "outcome": "SUCCESS" }`, `FAILURE`, or `TIMEOUT`
- `POST /api/orders/:id/cancel`

Order flow is `PENDING -> RESERVING -> RESERVED -> PAID`; failure, timeout, and cancellation release stock exactly once. Expiry runs every minute and atomically claims active reservations before releasing them. Payment requests are protected by unique order and idempotency keys.

## Frontend workspace

The React application includes a dashboard with sales and inventory metrics, responsive sidebar navigation, searchable and sortable live catalog, product creation/deletion, stock summaries, quantity-aware cart controls, order status filters, reservation countdowns, cancellation, and SUCCESS/FAILURE/TIMEOUT payment simulation. The UI always uses backend product and stock responses; it never edits inventory directly.

## Tests

```powershell
cd "POS Order & Inventory System\Backend"
npm test
```

For the live concurrency test, start the backend first and run `npm run test:concurrency`. It creates 50 concurrent one-unit buyers against ten units and requires exactly ten reservations, forty rejected requests, and no negative stock.
