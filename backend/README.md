# Food Delivery Backend

Production-ready Express + MongoDB + Socket.IO + Stripe (test mode) API for an online food delivery MERN app.
backend deployment link = https://backend-lhva.onrender.com

## Stack

- Node.js (ES modules)
- Express
- MongoDB / Mongoose
- Socket.IO (order status realtime)
- Stripe PaymentIntents (test mode)
- JWT auth, Helmet, CORS, rate limiting, express-validator

## Quick start

```bash
cd backend
cp .env.example .env
# edit .env with MongoDB URI, JWT_SECRET, Stripe test keys

npm install
npm run seed
npm run dev
```

Server listens on `0.0.0.0:5000` by default.

### Try without MongoDB Atlas (temporary)

```bash
npm run dev:memory
```

Starts an in-memory MongoDB, seeds demo data, then runs the API. Data is lost when you stop the process.

### Smoke test

```bash
npm run verify
```

Runs seed + API checks against in-memory MongoDB.

## Demo credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Customer | `aarav.sharma@fooddash.app` | `Demo@1234` |
| Restaurant Admin | `neha.kapoor@fooddash.app` | `Demo@1234` |
| Restaurant Admin 2 | `rohan.patel@fooddash.app` | `Demo@1234` |
| Platform Admin | `ananya.verma@fooddash.app` | `Demo@1234` |

## API overview

Base URL: `/api`

| Area | Prefix | Notes |
|------|--------|-------|
| Auth | `/api/auth` | register, login, me |
| Users | `/api/users` | profile, addresses CRUD |
| Restaurants | `/api/restaurants` | search/filter/sort/pagination, featured, admin CRUD |
| Menu | `/api/menu` | categories & items by restaurant; admin CRUD |
| Cart | `/api/cart` | single-restaurant cart; conflict if switching restaurants |
| Orders | `/api/orders` | create from cart, customer & restaurant flows |
| Payments | `/api/payments` | PaymentIntent, confirm, history, webhook |
| Reviews | `/api/reviews` | delivered orders only; moderation |
| Notifications | `/api/notifications` | list, mark read, unread count |
| Favorites | `/api/favorites` | toggle restaurants & food items |
| Health | `/api/health` | liveness |

Responses use:

```json
{ "success": true, "message": "...", "data": {} }
```

## Auth

Send `Authorization: Bearer <token>` on protected routes.

Register always creates a `customer`. Restaurant admins come from seed (or platform admin tooling).

## Payments (Stripe test)

1. Customer creates order from cart (`POST /api/orders`) — status `pending`, payment `pending`
2. `POST /api/payments/create-intent` with `{ "orderId" }` → returns `clientSecret`
3. Client confirms with Stripe.js using publishable key from `GET /api/payments/config`
4. Confirm via `POST /api/payments/confirm` **or** Stripe webhook `POST /api/payments/webhook`

Webhook needs raw body (already mounted before JSON parser) and `STRIPE_WEBHOOK_SECRET`.

## Socket.IO

Connect to the same HTTP server. Optional auth:

```js
io('http://localhost:5000', { auth: { token } })
// or query: ?token=
```

Rooms / events:

- `user:{userId}`, `restaurant:{restaurantId}`, `order:{orderId}`
- Client can emit `join:user`, `join:restaurant`, `join:order`
- Server emits `order:status`, `order:new`, `notification:new`

## Assumptions

- Tax = 8% of subtotal (`TAX_RATE`)
- Default delivery fee = restaurant value or `2.99`
- Images are URL strings (Unsplash in seed)
- Cart allows only one restaurant at a time

## Scripts

- `npm run dev` — watch mode
- `npm start` — production start
- `npm run seed` — wipe & seed demo data

## Deploy (Render)

See `render.yaml`. Set environment variables in the Render dashboard (especially `MONGODB_URI`, `JWT_SECRET`, Stripe keys, `CLIENT_URL`).
