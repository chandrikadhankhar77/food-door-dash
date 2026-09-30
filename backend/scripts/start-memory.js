/**
 * Start backend with an in-memory MongoDB (no Atlas / local mongod needed).
 * Useful for quick local demos. Data disappears when the process stops.
 *
 * Usage (from backend folder):
 *   node scripts/start-memory.js
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Load backend/.env first so real Stripe keys are used (don't override with dummies)
dotenv.config({ path: path.join(root, '.env') });

const mongod = await MongoMemoryServer.create({
  instance: {
    // Windows cold starts / first binary download often exceed the 10s default
    launchTimeout: 120000,
  },
});
const uri = mongod.getUri('food_delivery');

process.env.MONGODB_URI = uri;
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'fooddash_dev_jwt_secret_change_in_production_9f3a2b';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
process.env.PORT = process.env.PORT || '5000';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const isPlaceholder = (value = '') =>
  !value ||
  value.includes('your_stripe') ||
  value === 'sk_test_dummy' ||
  value === 'pk_test_dummy';

if (isPlaceholder(process.env.STRIPE_SECRET_KEY)) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
}
if (isPlaceholder(process.env.STRIPE_PUBLISHABLE_KEY)) {
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_dummy';
}

process.env.TAX_RATE = process.env.TAX_RATE || '0.08';
process.env.DEFAULT_DELIVERY_FEE = process.env.DEFAULT_DELIVERY_FEE || '2.99';

console.log('In-memory MongoDB ready');
console.log('Seeding demo data...');

await new Promise((resolve, reject) => {
  const seed = spawn(process.execPath, [path.join(root, 'scripts', 'seed.js')], {
    cwd: root,
    env: { ...process.env },
    stdio: 'inherit',
  });
  seed.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`seed failed: ${code}`))));
});

console.log('Starting API on http://localhost:' + process.env.PORT);

const server = spawn(process.execPath, ['--watch', path.join(root, 'src', 'server.js')], {
  cwd: root,
  env: { ...process.env },
  stdio: 'inherit',
});

const shutdown = async () => {
  server.kill();
  await mongod.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('exit', async () => {
  await mongod.stop();
  process.exit(0);
});
