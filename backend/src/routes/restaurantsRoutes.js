import { Router } from 'express';
import {
  listRestaurants,
  getFeatured,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getMyRestaurant,
  listValidators,
  restaurantBodyValidators,
  idParam,
} from '../controllers/restaurantsController.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/', listValidators, validate, listRestaurants);
router.get('/featured', getFeatured);
router.get('/mine', protect, authorize('restaurant_admin', 'admin'), getMyRestaurant);
router.get('/:id', idParam, validate, optionalAuth, getRestaurantById);

router.post(
  '/',
  protect,
  authorize('restaurant_admin', 'admin'),
  restaurantBodyValidators,
  validate,
  createRestaurant
);
router.put(
  '/:id',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  validate,
  updateRestaurant
);
router.delete(
  '/:id',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  validate,
  deleteRestaurant
);

export default router;
