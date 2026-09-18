import { body, param } from 'express-validator';
import MenuCategory from '../models/MenuCategory.js';
import FoodItem from '../models/FoodItem.js';
import Restaurant from '../models/Restaurant.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const assertRestaurantAccess = async (user, restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  if (user.role === 'admin') return restaurant;

  const isOwner =
    restaurant.owner.toString() === user._id.toString() ||
    user.restaurant?.toString() === restaurant._id.toString();

  if (!isOwner) throw new ApiError(403, 'Not authorized for this restaurant');
  return restaurant;
};

export const categoryValidators = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
  body('sortOrder').optional().isInt(),
];

export const foodItemValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('description').optional().isString(),
  body('isVegetarian').optional().isBoolean(),
  body('isAvailable').optional().isBoolean(),
  body('isPopular').optional().isBoolean(),
];

export const getMenuByRestaurant = asyncHandler(async (req, res) => {
  const restaurantId = req.params.restaurantId;
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    throw new ApiError(404, 'Restaurant not found');
  }

  const categories = await MenuCategory.find({ restaurant: restaurantId }).sort({
    sortOrder: 1,
    name: 1,
  });
  const items = await FoodItem.find({
    restaurant: restaurantId,
    isAvailable: true,
  }).sort({ isPopular: -1, name: 1 });

  res.json({
    success: true,
    message: 'Menu fetched',
    data: { restaurant, categories, items },
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await MenuCategory.find({
    restaurant: req.params.restaurantId,
  }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, message: 'Categories fetched', data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const restaurantId = req.params.restaurantId || req.body.restaurant;
  await assertRestaurantAccess(req.user, restaurantId);

  const category = await MenuCategory.create({
    restaurant: restaurantId,
    name: req.body.name,
    description: req.body.description,
    sortOrder: req.body.sortOrder ?? 0,
  });

  res.status(201).json({ success: true, message: 'Category created', data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await assertRestaurantAccess(req.user, category.restaurant);

  ['name', 'description', 'sortOrder'].forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  await category.save();

  res.json({ success: true, message: 'Category updated', data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  await assertRestaurantAccess(req.user, category.restaurant);

  const itemCount = await FoodItem.countDocuments({ category: category._id });
  if (itemCount > 0) {
    throw new ApiError(400, 'Remove or reassign food items before deleting category');
  }

  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted', data: null });
});

export const getItems = asyncHandler(async (req, res) => {
  const filter = { restaurant: req.params.restaurantId };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.available === 'true') filter.isAvailable = true;
  if (req.query.vegetarian === 'true') filter.isVegetarian = true;
  if (req.query.popular === 'true') filter.isPopular = true;

  const items = await FoodItem.find(filter)
    .populate('category', 'name')
    .sort({ isPopular: -1, name: 1 });

  res.json({ success: true, message: 'Food items fetched', data: items });
});

export const getItemById = asyncHandler(async (req, res) => {
  const item = await FoodItem.findById(req.params.id).populate('category', 'name');
  if (!item) throw new ApiError(404, 'Food item not found');
  res.json({ success: true, message: 'Food item fetched', data: item });
});

export const getPopularItems = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 24);
  const items = await FoodItem.find({
    isPopular: true,
    isAvailable: true,
  })
    .populate('restaurant', 'name image isActive')
    .populate('category', 'name')
    .sort({ updatedAt: -1 })
    .limit(limit);

  const filtered = items.filter(
    (item) => !item.restaurant || item.restaurant.isActive !== false
  );

  res.json({ success: true, message: 'Popular items fetched', data: filtered });
});

export const createFoodItem = asyncHandler(async (req, res) => {
  const restaurantId = req.body.restaurant || req.params.restaurantId;
  await assertRestaurantAccess(req.user, restaurantId);

  const category = await MenuCategory.findOne({
    _id: req.body.category,
    restaurant: restaurantId,
  });
  if (!category) throw new ApiError(400, 'Category not found for this restaurant');

  const item = await FoodItem.create({
    restaurant: restaurantId,
    category: category._id,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    image: req.body.image || '',
    nutritionalInfo: req.body.nutritionalInfo,
    isVegetarian: req.body.isVegetarian ?? false,
    isAvailable: req.body.isAvailable ?? true,
    addOns: req.body.addOns || [],
    isPopular: req.body.isPopular ?? false,
  });

  res.status(201).json({ success: true, message: 'Food item created', data: item });
});

export const updateFoodItem = asyncHandler(async (req, res) => {
  const item = await FoodItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Food item not found');
  await assertRestaurantAccess(req.user, item.restaurant);

  const fields = [
    'name',
    'description',
    'price',
    'image',
    'nutritionalInfo',
    'isVegetarian',
    'isAvailable',
    'addOns',
    'isPopular',
    'category',
  ];

  for (const f of fields) {
    if (req.body[f] !== undefined) item[f] = req.body[f];
  }

  if (req.body.category) {
    const category = await MenuCategory.findOne({
      _id: req.body.category,
      restaurant: item.restaurant,
    });
    if (!category) throw new ApiError(400, 'Category not found for this restaurant');
  }

  await item.save();
  res.json({ success: true, message: 'Food item updated', data: item });
});

export const deleteFoodItem = asyncHandler(async (req, res) => {
  const item = await FoodItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Food item not found');
  await assertRestaurantAccess(req.user, item.restaurant);

  item.isAvailable = false;
  await item.save();
  res.json({ success: true, message: 'Food item deactivated', data: item });
});

export const restaurantIdParam = [
  param('restaurantId').isMongoId().withMessage('Invalid restaurant id'),
];
export const idParam = [param('id').isMongoId().withMessage('Invalid id')];
