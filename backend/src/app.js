import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { stripeWebhook } from './controllers/paymentsController.js';
import ApiError from './utils/ApiError.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// In development, treat localhost and 127.0.0.1 as interchangeable for CORS.
const expandDevOrigins = (origins) => {
  if (process.env.NODE_ENV === 'production') return origins;
  const expanded = new Set(origins);
  for (const origin of origins) {
    if (origin.includes('localhost')) {
      expanded.add(origin.replace('localhost', '127.0.0.1'));
    }
    if (origin.includes('127.0.0.1')) {
      expanded.add(origin.replace('127.0.0.1', 'localhost'));
    }
  }
  return [...expanded];
};

const corsOrigins = expandDevOrigins(allowedOrigins);

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', apiLimiter, routes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Food Delivery API',
    data: { docs: '/api/health' },
  });
});

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

export default app;
