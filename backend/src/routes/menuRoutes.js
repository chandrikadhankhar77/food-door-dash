import { Router } from 'express';
import {
  getMenuByRestaurant,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  getItemById,
  getPopularItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  categoryValidators,
  foodItemValidators,
  restaurantIdParam,
  idParam,
} from '../controllers/menuController.js';
import { protect } from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/popular', getPopularItems);

router.get(
  '/restaurants/:restaurantId',
  restaurantIdParam,
  validate,
  getMenuByRestaurant
);
router.get(
  '/restaurants/:restaurantId/categories',
  restaurantIdParam,
  validate,
  getCategories
);
router.get(
  '/restaurants/:restaurantId/items',
  restaurantIdParam,
  validate,
  getItems
);
router.get('/items/:id', idParam, validate, getItemById);

router.post(
  '/restaurants/:restaurantId/categories',
  protect,
  authorize('restaurant_admin', 'admin'),
  restaurantIdParam,
  categoryValidators,
  validate,
  createCategory
);
router.put(
  '/categories/:id',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  categoryValidators,
  validate,
  updateCategory
);
router.delete(
  '/categories/:id',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  validate,
  deleteCategory
);

router.post(
  '/restaurants/:restaurantId/items',
  protect,
  authorize('restaurant_admin', 'admin'),
  restaurantIdParam,
  foodItemValidators,
  validate,
  createFoodItem
);
router.put(
  '/items/:id',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  validate,
  updateFoodItem
);
router.delete(
  '/items/:id',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  validate,
  deleteFoodItem
);

export default router;
