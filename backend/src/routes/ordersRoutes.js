import { Router } from 'express';
import {
  createOrder,
  listMyOrders,
  getOrderById,
  listRestaurantOrders,
  getRestaurantOrderStats,
  changeOrderStatus,
  cancelMyOrder,
  createOrderValidators,
  statusValidators,
  idParam,
} from '../controllers/ordersController.js';
import { protect } from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.post('/', createOrderValidators, validate, createOrder);
router.get('/mine', listMyOrders);
router.get(
  '/restaurant/stats',
  authorize('restaurant_admin', 'admin'),
  getRestaurantOrderStats
);
router.get(
  '/restaurant',
  authorize('restaurant_admin', 'admin'),
  listRestaurantOrders
);
router.get('/:id', idParam, validate, getOrderById);
router.patch(
  '/:id/status',
  authorize('restaurant_admin', 'admin'),
  idParam,
  statusValidators,
  validate,
  changeOrderStatus
);
router.patch('/:id/cancel', idParam, validate, cancelMyOrder);

export default router;
