# FoodDash — Online Food Delivery (MERN)

FoodDash is a full-stack food ordering platform where customers browse restaurants and place orders, restaurant owners manage menus and order status, and payments are handled with Stripe (test mode) plus Cash on Delivery.

**Repository:** [https://github.com/chandrikadhankhar77/food-door-dash](https://github.com/chandrikadhankhar77/food-door-dash)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started (local)](#getting-started-local)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [API overview](#api-overview)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Author](#author)
- [License](#license)

---

## Features

### Customer
- Browse / search / filter restaurants
- View menus, add to cart (single-restaurant cart)
- Checkout with **Cash on Delivery** or **Stripe Hosted Checkout**
- Track orders with live map (Google Maps if key set, otherwise OpenStreetMap)
- Favorites, reviews, notifications, profile & addresses

### Restaurant admin
- Dashboard for orders, menu, restaurant profile, reviews
- Update order status (confirmed → preparing → out for delivery → delivered)
- Real-time updates via Socket.IO

### Payments
- Stripe Checkout portal (`checkout.stripe.com`) for card payments
- COD flow for cash on delivery
- Payment history

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, Socket.IO Client, Stripe.js, Leaflet / Google Maps |
| Backend | Node.js (ESM), Express, MongoDB / Mongoose, JWT, Socket.IO, Stripe, Helmet, CORS, rate limiting |
| Database | MongoDB Atlas (production) / local MongoDB or in-memory (dev) |
| Hosting | Backend → [Render](https://backend-lhva.onrender.com) · Frontend → Netlify |

---

## Project structure

```text
Restaurant/
├── backend/                 # Express API
│   ├── scripts/             # seed, start-memory, verify
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── render.yaml
├── frontend/                # React (Vite) app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   ├── netlify.toml
│   └── package.json
├── package.json             # monorepo helpers
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ (recommended 20+)
- **npm** 9+
- **MongoDB** — local install **or** MongoDB Atlas connection string
- (Optional) Stripe test keys for card payments
- (Optional) Google Maps JavaScript API key for Google Maps tracking

---

## Getting started (local)

### 1. Clone the repository

```bash
git clone https://github.com/chandrikadhankhar77/food-door-dash.git
cd food-door-dash
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, Stripe keys, CLIENT_URL
npm install
npm run seed
npm run dev
```

API default: `http://localhost:5000`

**No local MongoDB?** Use in-memory Mongo instead:

```bash
npm run dev:memory
```

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api  (or your Render URL)
# Set VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
npm install
npm run dev
```

App default: `http://localhost:5173`

### 4. Run both from monorepo root (optional)

```bash
npm install
npm run dev
# or memory mode:
npm run dev:memory
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB / Atlas connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `JWT_EXPIRE` | No | Token lifetime (default `7d`) |
| `PORT` | No | Local port (default `5000`; Render sets this automatically) |
| `NODE_ENV` | No | `development` / `production` |
| `CLIENT_URL` | Yes (prod) | Frontend origin(s), comma-separated for CORS / Stripe return |
| `STRIPE_SECRET_KEY` | For cards | Stripe secret key (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | For cards | Stripe publishable key (`pk_test_...`) |
| `STRIPE_CURRENCY` | No | Default `usd` |
| `STRIPE_WEBHOOK_SECRET` | Optional | Stripe webhook signing secret |
| `TAX_RATE` | No | Default `0.08` |
| `DEFAULT_DELIVERY_FEE` | No | Default `2.99` |
| `DEFAULT_ETA_MINUTES` | No | Default `35` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base, e.g. `http://localhost:5000/api` or `https://backend-lhva.onrender.com/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For cards | Same publishable key as backend |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Enables Google Maps on order tracking; empty → OpenStreetMap |

> Never commit real `.env` files. Only `.env.example` is tracked.

---

## Demo accounts

After running `npm run seed` in `backend/`:

| Role | Email | Password |
|------|--------|----------|
| Customer | `aarav.sharma@fooddash.app` | `Demo@1234` |
| Restaurant Admin (Spice Route Kitchen) | `neha.kapoor@fooddash.app` | `Demo@1234` |
| Restaurant Admin 2 | `rohan.patel@fooddash.app` | `Demo@1234` |
| Platform Admin | `ananya.verma@fooddash.app` | `Demo@1234` |

---

## API overview

Base URL: `/api`

| Area | Prefix | Notes |
|------|--------|-------|
| Auth | `/api/auth` | register, login, me |
| Users | `/api/users` | profile, addresses |
| Restaurants | `/api/restaurants` | list, search, CRUD (admin) |
| Menu | `/api/menu` | categories & items |
| Cart | `/api/cart` | single-restaurant cart |
| Orders | `/api/orders` | customer + restaurant flows |
| Payments | `/api/payments` | Stripe Checkout session, COD, confirm, history |
| Reviews | `/api/reviews` | post-delivery reviews |
| Notifications | `/api/notifications` | in-app notifications |
| Favorites | `/api/favorites` | restaurants & items |
| Health | `/api/health` | liveness check |

Standard response shape:

```json
{ "success": true, "message": "...", "data": {} }
```

Protected routes require:

```http
Authorization: Bearer <jwt>
```

Live health check (deployed):  
[https://backend-lhva.onrender.com/api/health](https://backend-lhva.onrender.com/api/health)

---

## Deployment

### Backend (Render)

1. New **Web Service** from this GitHub repo  
2. **Root Directory:** `backend`  
3. **Build:** `npm install`  
4. **Start:** `npm start`  
5. **Health check:** `/api/health`  
6. Set environment variables (see table above), especially:
   - `MONGODB_URI` (Atlas; Network Access must allow `0.0.0.0/0`)
   - `JWT_SECRET`
   - Stripe keys
   - `CLIENT_URL` = your Netlify URL  
7. After first deploy, open Render **Shell** and run: `npm run seed`

Current backend URL: `https://backend-lhva.onrender.com`

### Frontend (Netlify)

1. New site from the same GitHub repo  
2. **Base directory:** `frontend`  
3. **Build command:** `npm run build`  
4. **Publish directory:** `dist` (or `frontend/dist` depending on UI)  
5. Environment variables:
   - `VITE_API_URL=https://backend-lhva.onrender.com/api`
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - `VITE_GOOGLE_MAPS_API_KEY=` (optional)  
6. Redeploy after changing any `VITE_*` variable  
7. Update Render `CLIENT_URL` to the Netlify site URL (no trailing slash)

`frontend/netlify.toml` already configures SPA redirects.

---

## Scripts

### Root

| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend + frontend together |
| `npm run dev:memory` | Backend (in-memory Mongo) + frontend |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | API with nodemon / watch |
| `npm run start` | Production start |
| `npm run seed` | Seed demo users, restaurants, menu |
| `npm run dev:memory` | In-memory Mongo + seed + API |
| `npm run verify` | Smoke tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

---

## Stripe test card

When using **Pay by Card (Stripe)**:

- Card: `4242 4242 4242 4242`
- Expiry: any future date  
- CVC: any 3 digits  
- ZIP: any  

---

## Author

- **Chandrika Dhankhar** — [github.com/chandrikadhankhar77](https://github.com/chandrikadhankhar77)

---

## License

This project is provided for learning / internal training purposes unless otherwise specified by the repository owner.
