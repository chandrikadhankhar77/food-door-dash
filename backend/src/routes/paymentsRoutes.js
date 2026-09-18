import { Router } from 'express';
import {
  getConfig,
  createIntent,
  createCheckout,
  confirmCheckout,
  confirmPayment,
  payWithCod,
  paymentHistory,
  listPaymentMethods,
  removePaymentMethod,
  createIntentValidators,
  createCheckoutValidators,
  codValidators,
  idParam,
} from '../controllers/paymentsController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

router.get('/config', getConfig);

router.use(protect);

router.post('/create-intent', createIntentValidators, validate, createIntent);
router.post(
  '/create-checkout-session',
  createCheckoutValidators,
  validate,
  createCheckout
);
router.post('/cod', codValidators, validate, payWithCod);
router.post(
  '/confirm-checkout',
  body('sessionId').notEmpty().withMessage('sessionId is required'),
  validate,
  confirmCheckout
);
router.post(
  '/confirm',
  body('paymentIntentId').notEmpty().withMessage('paymentIntentId is required'),
  validate,
  confirmPayment
);
router.get('/history', paymentHistory);
router.get('/methods', listPaymentMethods);
router.delete('/methods/:id', idParam, validate, removePaymentMethod);

export default router;
