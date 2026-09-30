# FoodDash — Online Food Delivery App

FoodDash is a full-stack **MERN** food ordering application. Customers browse restaurants, customize dishes, place orders, pay (Stripe test mode or cash on delivery), and track delivery in real time. Restaurant partners manage their menu, orders, and reviews from an admin dashboard.

| Folder | App | Default URL |
|--------|-----|-------------|
| `frontend/` | React + Vite + Tailwind UI | http://localhost:5173 |
| `backend/` | Express + MongoDB + Socket.IO + Stripe API | http://localhost:5000 |

> For Netlify + Render deploys, push `frontend/` and `backend/` as separate repos. Locally you can run both together from this root.

---

## What this project is about

FoodDash is a coursework / portfolio food-delivery platform with three roles:

- **Customer** — discover restaurants, cart, checkout, pay, track orders, favorites, notifications
- **Restaurant partner** (`restaurant_admin`) — dashboard for restaurant profile, menu, orders, reviews
- **Platform admin** — seeded elevated account for demo/admin flows

Realtime order updates use **Socket.IO**. Payments use **Stripe** (test mode) plus an optional COD path. Auth uses **JWT**, with forgot/reset password support.

---

## What is implemented

### Customer
- Register / login (customer or restaurant partner)
- Forgot password + reset password (dev mode shows an on-screen reset link)
- Browse / filter restaurants, view menus, customize items with add-ons
- Single-restaurant cart, checkout, promo codes
- Stripe checkout / PaymentIntent flow and payment success / pending / failed pages
- Cash on delivery
- Order history, live order timeline + map tracking
- Favorites, notifications, profile & addresses, payment history
- Change password while logged in

### Restaurant partner
- Self-register as **Restaurant partner**
- Dashboard: stats, create/edit restaurant, menu CRUD, order status management, reviews, settings
- Role-based access so customers cannot open the partner dashboard

### Platform / engineering
- JWT auth and roles: `customer`, `restaurant_admin`, `admin`
- REST API under `/api` with validation, rate limiting, Helmet, CORS
- MongoDB models for users, restaurants, menu, cart, orders, payments, reviews, favorites, notifications, promos
- Seed script with demo catalog + accounts (preserves custom registered users)
- In-memory Mongo mode for quick demos without Atlas

---

## Tech stack

- **Frontend:** React 19, React Router, Axios, Tailwind CSS 4, Vite, Socket.IO client, Stripe.js, Leaflet / optional Google Maps
- **Backend:** Node.js (ESM), Express, Mongoose, Socket.IO, Stripe, JWT, bcrypt, express-validator
- **Database:** MongoDB (Atlas, local, or in-memory for demos)

---

## Prerequisites

- **Node.js 22+** (Vite 8 does not work reliably on Node 21)
- npm 10+
- MongoDB Atlas URI **or** use in-memory demo mode (no Mongo install required)

```bash
# If you use nvm:
nvm use 22
```

---

## How to run locally

### Quick start (recommended — no Atlas needed)

From the **repo root**:

```bash
# 1) Install dependencies
npm run install:all

# 2) Env files (first time only)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3) Start API (in-memory Mongo + seed) + frontend
npm run dev:memory
```

Open:

- **App:** http://localhost:5173
- **API health:** http://localhost:5000/api/health

#### Note about `dev:memory`

- Uses an **in-memory** database that disappears when the process stops.
- Each start re-seeds the **demo** `@fooddash.app` accounts and catalog.
- Accounts you register yourself only persist for that process lifetime in pure memory mode. For durable accounts, use MongoDB Atlas (below).

### Run with MongoDB Atlas / local MongoDB

1. Set `backend/.env`:

```env
MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER/food_delivery
JWT_SECRET=a_long_random_secret
CLIENT_URL=http://localhost:5173
```

2. Optional Stripe **test** keys (full card payments need real test keys):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

And in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

3. Seed demo data, then start both apps:

```bash
npm run seed
npm run dev
```

`npm run seed` refreshes the **demo catalog** and **demo `@fooddash.app` users** only. Users you registered yourself (for example a restaurant partner) are **kept**, so a second login after re-seed still works. If the demo restaurants were rebuilt, a partner’s restaurant link may be cleared — they can create the restaurant again under **Dashboard → Restaurant**.

---

## Demo / test credentials

After seed or `dev:memory`:

| Role | Email | Password |
|------|-------|----------|
| Customer | `aarav.sharma@fooddash.app` | `Demo@1234` |
| Restaurant Admin | `neha.kapoor@fooddash.app` | `Demo@1234` |
| Restaurant Admin 2 | `rohan.patel@fooddash.app` | `Demo@1234` |
| Platform Admin | `ananya.verma@fooddash.app` | `Demo@1234` |

You can also **Register → Restaurant partner**, create a restaurant under **Dashboard → Restaurant**, then log out and log back in with the same email/password.

Forgot a password? Use **Forgot password?** on the login page. In development the API returns a reset link on screen (no email provider is configured).

---

## Useful scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install root + backend + frontend deps |
| `npm run dev:memory` | In-memory Mongo + seed + API + frontend |
| `npm run dev` | Backend (needs `MONGODB_URI`) + frontend |
| `npm run seed` | Re-seed demo users/catalog (keeps custom users) |
| `npm run verify` | Backend API smoke test (in-memory) |
| `npm run build` | Production build of the frontend |

---

## Project structure (short)

```text
backend/src/
  server.js          # HTTP + DB + Socket.IO entry
  app.js             # Express middleware & /api mount
  routes/            # REST route map
  controllers/       # Request handlers (incl. forgot/reset password)
  models/            # Mongoose schemas
  services/          # Orders, Stripe, notifications
  sockets/           # Realtime order rooms
frontend/src/
  routes/AppRouter.jsx   # Pages + auth/role guards
  pages/                 # Customer + dashboard screens
  context/               # Auth, cart, socket, notifications
  services/              # Axios API clients
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Frontend crash mentioning Rolldown / native binding | Node 21 | Use Node 22+ (`nvm use 22`), reinstall `frontend/node_modules` |
| Login fails after stopping `dev:memory` | In-memory DB was wiped | Use Atlas for durable accounts, or register again |
| Stripe payment errors | Placeholder Stripe keys | Add real **test** keys to backend + frontend `.env` |
| CORS errors | Frontend origin mismatch | Set `CLIENT_URL=http://localhost:5173` in `backend/.env` |

---

## License

MIT — student / coursework project.
