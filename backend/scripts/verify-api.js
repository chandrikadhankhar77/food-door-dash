/**
 * Smoke-test the API against an in-memory MongoDB.
 * Does not require Atlas or a local mongod install.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForHealth(base, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

async function main() {
  console.log('Starting in-memory MongoDB...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('food_delivery');
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'verify_jwt_secret_fooddash';
  process.env.JWT_EXPIRE = '7d';
  process.env.PORT = '5055';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.NODE_ENV = 'development';
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
  process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';
  process.env.TAX_RATE = '0.08';
  process.env.DEFAULT_DELIVERY_FEE = '2.99';

  console.log('Seeding demo data...');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', 'seed.js')], {
      cwd: root,
      env: { ...process.env },
      stdio: 'inherit',
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed exit ${code}`))));
  });

  console.log('Starting API server on :5055...');
  const server = spawn(process.execPath, [path.join(root, 'src', 'server.js')], {
    cwd: root,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (d) => {
    serverLog += d.toString();
  });
  server.stderr.on('data', (d) => {
    serverLog += d.toString();
  });

  const base = 'http://127.0.0.1:5055';
  const healthy = await waitForHealth(base);
  if (!healthy) {
    console.error('Server failed to become healthy.\n', serverLog);
    server.kill();
    await mongod.stop();
    process.exit(1);
  }

  const failures = [];
  const check = async (name, fn) => {
    try {
      await fn();
      console.log(`OK  ${name}`);
    } catch (err) {
      console.error(`FAIL ${name}:`, err.message);
      failures.push(name);
    }
  };

  await check('health', async () => {
    const res = await fetch(`${base}/api/health`);
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json));
  });

  let token = '';
  let adminToken = '';
  let restaurantId = '';
  let foodItemId = '';
  let orderId = '';

  await check('login customer', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aarav.sharma@fooddash.app', password: 'Demo@1234' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(JSON.stringify(json));
    token = json.data.token;
  });

  await check('login admin', async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'neha.kapoor@fooddash.app', password: 'Demo@1234' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(JSON.stringify(json));
    adminToken = json.data.token;
  });

  await check('list restaurants', async () => {
    const res = await fetch(`${base}/api/restaurants`);
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json));
    if (!(json.data.items || []).length) throw new Error('No restaurants returned');
  });

  await check('admin restaurant + menu', async () => {
    const mineRes = await fetch(`${base}/api/restaurants/mine`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const mineJson = await mineRes.json();
    if (!mineRes.ok || !mineJson.success) throw new Error(JSON.stringify(mineJson));
    restaurantId = mineJson.data?._id || mineJson.data?.restaurant?._id;
    if (!restaurantId) throw new Error('No restaurant for admin: ' + JSON.stringify(mineJson.data).slice(0, 300));

    const res = await fetch(`${base}/api/menu/restaurants/${restaurantId}`);
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json));
    const items = json.data.items || [];
    foodItemId = items[0]?._id;
    if (!foodItemId) throw new Error('No food item in menu response');
  });

  await check('add to cart', async () => {
    const res = await fetch(`${base}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ foodItemId, quantity: 1 }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(JSON.stringify(json));
  });

  await check('create order', async () => {
    const res = await fetch(`${base}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        deliveryType: 'now',
        deliveryAddress: {
          label: 'Home',
          street: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
        },
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(JSON.stringify(json));
    orderId = json.data?._id || json.data?.order?._id;
    if (!orderId) throw new Error('No order id: ' + JSON.stringify(json.data).slice(0, 300));
  });

  await check('admin update status', async () => {
    const res = await fetch(`${base}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'confirmed' }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(JSON.stringify(json));
  });

  await check('favorites toggle', async () => {
    const res = await fetch(`${base}/api/favorites/restaurants/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ restaurantId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(JSON.stringify(json));
  });

  server.kill();
  await mongoose.disconnect().catch(() => {});
  await mongod.stop();

  // silence unused imports if tree-shaken differently
  void bcrypt;
  void jwt;

  if (failures.length) {
    console.error('\nFailures:', failures.join(', '));
    process.exit(1);
  }
  console.log('\nAll API smoke tests passed.');
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
