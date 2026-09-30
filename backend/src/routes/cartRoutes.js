import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  addValidators,
  itemIdParam,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

router.use(protect);
router.use(authorize('customer'));

router.get('/', getCart);
router.post('/items', addValidators, validate, addToCart);
router.put(
  '/items/:itemId',
  itemIdParam,
  body('quantity').isInt({ min: 1 }),
  validate,
  updateCartItem
);
router.delete('/items/:itemId', itemIdParam, validate, removeCartItem);
router.delete('/', clearCart);

export default router;
