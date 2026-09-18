import { Router } from 'express';
import {
  getFavorites,
  toggleRestaurant,
  toggleFoodItem,
  restaurantToggleValidators,
  foodToggleValidators,
} from '../controllers/favoritesController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/restaurants/toggle', restaurantToggleValidators, validate, toggleRestaurant);
router.post('/food-items/toggle', foodToggleValidators, validate, toggleFoodItem);

export default router;
