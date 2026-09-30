import { Router } from 'express';
import {
  listActivePromos,
  validatePromo,
  createPromo,
  createValidators,
  validatePromoValidators,
} from '../controllers/promosController.js';
import { protect } from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/', listActivePromos);
router.post(
  '/validate',
  protect,
  authorize('customer'),
  validatePromoValidators,
  validate,
  validatePromo
);
router.post(
  '/',
  protect,
  authorize('admin'),
  createValidators,
  validate,
  createPromo
);

export default router;
