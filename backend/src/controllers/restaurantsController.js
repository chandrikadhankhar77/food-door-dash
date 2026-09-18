import { body, param, query } from 'express-validator';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listValidators = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

export const restaurantBodyValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().isString(),
  body('cuisine').optional(),
  body('address.street').trim().notEmpty(),
  body('address.city').trim().notEmpty(),
  body('address.state').trim().notEmpty(),
  body('address.zip').trim().notEmpty(),
  body('location').optional().isString(),
  body('priceRange').optional().isIn(['$', '$$', '$$$', '$$$$']),
  body('deliveryFee').optional().isFloat({ min: 0 }),
];

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listRestaurants = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  if (req.query.search) {
    const q = String(req.query.search).trim();
    const regex = new RegExp(escapeRegex(q), 'i');

    const foodMatches = await FoodItem.find({
      isAvailable: true,
      $or: [{ name: regex }, { description: regex }],
    })
      .select('restaurant')
      .limit(80);

    const restaurantIdsFromFood = [
      ...new Set(foodMatches.map((f) => String(f.restaurant))),
    ];

    filter.$or = [
      { name: regex },
      { description: regex },
      { location: regex },
      { cuisine: regex },
      ...(restaurantIdsFromFood.length
        ? [{ _id: { $in: restaurantIdsFromFood } }]
        : []),
    ];
  }

  if (req.query.cuisine) {
    const cuisines = String(req.query.cuisine)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cuisines.length) {
      // Match cuisine tags case-insensitively
      filter.cuisine = {
        $in: cuisines.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')),
      };
    }
  }
  if (req.query.location) {
    filter.location = new RegExp(escapeRegex(req.query.location), 'i');
  }
  if (req.query.priceRange) {
    filter.priceRange = req.query.priceRange;
  }
  const minRating = req.query.minRating || req.query.rating;
  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }

  let sort = { rating: -1, createdAt: -1 };
  if (req.query.sort === 'rating') sort = { rating: -1 };
  if (req.query.sort === 'deliveryFee') sort = { deliveryFee: 1 };
  if (req.query.sort === 'newest') sort = { createdAt: -1 };
  if (req.query.sort === 'name') sort = { name: 1 };

  const [items, total] = await Promise.all([
    Restaurant.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email'),
    Restaurant.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Restaurants fetched',
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const getFeatured = asyncHandler(async (req, res) => {
  const items = await Restaurant.find({ isActive: true, isFeatured: true })
    .sort({ rating: -1 })
    .limit(Number(req.query.limit) || 8);
  res.json({ success: true, message: 'Featured restaurants', data: items });
});

export const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate(
    'owner',
    'name email'
  );
  if (!restaurant || (!restaurant.isActive && req.user?.role !== 'admin' && req.user?.role !== 'restaurant_admin')) {
    throw new ApiError(404, 'Restaurant not found');
  }
  res.json({ success: true, message: 'Restaurant fetched', data: restaurant });
});

export const createRestaurant = asyncHandler(async (req, res) => {
  if (req.user.role === 'restaurant_admin' && req.user.restaurant) {
    throw new ApiError(400, 'You already own a restaurant');
  }

  const payload = { ...req.body, owner: req.user._id };
  if (!payload.location && payload.address?.city) {
    payload.location = payload.address.city;
  }
  if (typeof payload.cuisine === 'string') {
    payload.cuisine = payload.cuisine.split(',').map((c) => c.trim()).filter(Boolean);
  }

  const restaurant = await Restaurant.create(payload);

  if (req.user.role === 'restaurant_admin' || req.user.role === 'admin') {
    await User.findByIdAndUpdate(req.user._id, { restaurant: restaurant._id });
  }

  // Notify customers about the new restaurant listing
  try {
    const { createNotification } = await import('../services/notificationService.js');
    const customers = await User.find({ role: 'customer' }).select('_id').limit(200);
    await Promise.all(
      customers.map((c) =>
        createNotification({
          userId: c._id,
          title: 'New restaurant on FoodDash',
          message: `${restaurant.name} is now available${
            restaurant.location ? ` in ${restaurant.location}` : ''
          }. Check out their menu!`,
          type: 'promo',
        })
      )
    );
  } catch {
    // non-blocking
  }

  res.status(201).json({
    success: true,
    message: 'Restaurant created',
    data: restaurant,
  });
});

export const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  const isOwner =
    restaurant.owner.toString() === req.user._id.toString() ||
    req.user.restaurant?.toString() === restaurant._id.toString();

  if (req.user.role !== 'admin' && !isOwner) {
    throw new ApiError(403, 'Not authorized to update this restaurant');
  }

  const fields = [
    'name',
    'description',
    'cuisine',
    'address',
    'location',
    'openingHours',
    'closingHours',
    'image',
    'priceRange',
    'contact',
    'isActive',
    'isFeatured',
    'deliveryFee',
  ];

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (f === 'cuisine' && typeof req.body[f] === 'string') {
        restaurant[f] = req.body[f].split(',').map((c) => c.trim()).filter(Boolean);
      } else if (f === 'isFeatured' && req.user.role !== 'admin') {
        continue;
      } else {
        restaurant[f] = req.body[f];
      }
    }
  }

  if (!restaurant.location && restaurant.address?.city) {
    restaurant.location = restaurant.address.city;
  }

  await restaurant.save();
  res.json({ success: true, message: 'Restaurant updated', data: restaurant });
});

export const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  const isOwner =
    restaurant.owner.toString() === req.user._id.toString() ||
    req.user.restaurant?.toString() === restaurant._id.toString();

  if (req.user.role !== 'admin' && !isOwner) {
    throw new ApiError(403, 'Not authorized to delete this restaurant');
  }

  restaurant.isActive = false;
  await restaurant.save();

  res.json({ success: true, message: 'Restaurant deactivated', data: restaurant });
});

export const getMyRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({
    $or: [{ owner: req.user._id }, { _id: req.user.restaurant }],
  });
  if (!restaurant) throw new ApiError(404, 'No restaurant linked to this account');
  res.json({ success: true, message: 'My restaurant', data: restaurant });
});

export const idParam = [param('id').isMongoId().withMessage('Invalid restaurant id')];
