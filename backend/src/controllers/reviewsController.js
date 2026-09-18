import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const recalcRestaurantRating = async (restaurantId) => {
  const rid = new mongoose.Types.ObjectId(String(restaurantId));
  const stats = await Review.aggregate([
    {
      $match: {
        restaurant: rid,
        moderationStatus: 'approved',
      },
    },
    {
      $group: {
        _id: '$restaurant',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await Restaurant.findByIdAndUpdate(rid, {
    rating: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
};

export const createValidators = [
  body('orderId').isMongoId().withMessage('Valid order id is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('deliveryRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Delivery rating must be 1-5'),
  body('comment').optional().isString().isLength({ max: 1000 }),
];

export const createReview = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to review this order');
  }
  if (order.status !== 'delivered') {
    throw new ApiError(400, 'You can only review delivered orders');
  }

  const existing = await Review.findOne({ user: req.user._id, order: order._id });
  if (existing) throw new ApiError(400, 'You already reviewed this order');

  const review = await Review.create({
    user: req.user._id,
    restaurant: order.restaurant,
    order: order._id,
    rating: req.body.rating,
    deliveryRating: req.body.deliveryRating,
    comment: req.body.comment || '',
    moderationStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted for moderation',
    data: review,
  });
});

export const listRestaurantReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    restaurant: req.params.restaurantId,
    moderationStatus: 'approved',
  };

  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Reviews fetched',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const listPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ moderationStatus: 'pending' })
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('restaurant', 'name');
  res.json({ success: true, message: 'Pending reviews', data: reviews });
});

export const listManageReviews = asyncHandler(async (req, res) => {
  let restaurantId = req.user.restaurant;

  if (req.user.role === 'admin' && req.query.restaurantId) {
    restaurantId = req.query.restaurantId;
  }

  if (!restaurantId) {
    const owned = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    restaurantId = owned?._id;
  }

  if (!restaurantId) {
    throw new ApiError(400, 'No restaurant associated with this account');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { restaurant: restaurantId };
  if (req.query.moderationStatus) {
    filter.moderationStatus = req.query.moderationStatus;
  }

  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar'),
    Review.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Restaurant reviews fetched',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be approved or rejected');
  }

  const review = await Review.findById(req.params.id).populate('restaurant');
  if (!review) throw new ApiError(404, 'Review not found');

  if (req.user.role === 'restaurant_admin') {
    const reviewRestaurantId = (
      review.restaurant?._id || review.restaurant
    ).toString();
    const ownsRestaurant =
      req.user.restaurant?.toString() === reviewRestaurantId ||
      review.restaurant?.owner?.toString() === req.user._id.toString();
    if (!ownsRestaurant) {
      throw new ApiError(403, 'Not authorized to moderate this review');
    }
  }

  review.moderationStatus = status;
  await review.save();
  await recalcRestaurantRating(review.restaurant._id || review.restaurant);

  res.json({ success: true, message: `Review ${status}`, data: review });
});

export const respondToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('restaurant');
  if (!review) throw new ApiError(404, 'Review not found');

  const restaurant = review.restaurant;
  const isOwner =
    restaurant.owner?.toString() === req.user._id.toString() ||
    req.user.restaurant?.toString() === restaurant._id.toString();

  if (req.user.role !== 'admin' && !isOwner) {
    throw new ApiError(403, 'Not authorized to respond');
  }

  review.adminResponse = req.body.adminResponse || '';
  await review.save();

  res.json({ success: true, message: 'Response saved', data: review });
});

export const restaurantIdParam = [
  param('restaurantId').isMongoId().withMessage('Invalid restaurant id'),
];
export const idParam = [param('id').isMongoId().withMessage('Invalid review id')];
