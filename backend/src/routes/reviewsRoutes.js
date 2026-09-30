import { Router } from 'express';
import {
  createReview,
  listRestaurantReviews,
  listPendingReviews,
  listManageReviews,
  moderateReview,
  respondToReview,
  createValidators,
  restaurantIdParam,
  idParam,
} from '../controllers/reviewsController.js';
import { protect } from '../middleware/auth.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { body } from 'express-validator';

const router = Router();

router.get(
  '/restaurant/:restaurantId',
  restaurantIdParam,
  validate,
  listRestaurantReviews
);

router.post('/', protect, createValidators, validate, createReview);

router.get(
  '/manage',
  protect,
  authorize('restaurant_admin', 'admin'),
  listManageReviews
);

router.get(
  '/pending',
  protect,
  authorize('admin'),
  listPendingReviews
);

router.patch(
  '/:id/moderate',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  body('status').isIn(['approved', 'rejected']),
  validate,
  moderateReview
);

router.patch(
  '/:id/respond',
  protect,
  authorize('restaurant_admin', 'admin'),
  idParam,
  body('adminResponse').optional().isString(),
  validate,
  respondToReview
);

export default router;
