import { body } from 'express-validator';
import Favorite from '../models/Favorite.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const getOrCreateFavorite = async (userId) => {
  let fav = await Favorite.findOne({ user: userId });
  if (!fav) {
    fav = await Favorite.create({ user: userId, restaurants: [], foodItems: [] });
  }
  return fav;
};

export const getFavorites = asyncHandler(async (req, res) => {
  const fav = await getOrCreateFavorite(req.user._id);
  await fav.populate([
    { path: 'restaurants', select: 'name image rating cuisine location priceRange deliveryFee' },
    { path: 'foodItems', select: 'name image price isVegetarian restaurant isAvailable' },
  ]);

  res.json({ success: true, message: 'Favorites fetched', data: fav });
});

export const toggleRestaurant = asyncHandler(async (req, res) => {
  const restaurantId = req.body.restaurantId;
  if (!restaurantId) throw new ApiError(400, 'restaurantId is required');

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');

  const fav = await getOrCreateFavorite(req.user._id);
  const idx = fav.restaurants.findIndex((id) => id.toString() === restaurantId);
  let added = false;

  if (idx >= 0) {
    fav.restaurants.splice(idx, 1);
  } else {
    fav.restaurants.push(restaurantId);
    added = true;
  }

  await fav.save();
  await fav.populate([
    { path: 'restaurants', select: 'name image rating cuisine location priceRange deliveryFee' },
    { path: 'foodItems', select: 'name image price isVegetarian restaurant isAvailable' },
  ]);

  res.json({
    success: true,
    message: added ? 'Restaurant added to favorites' : 'Restaurant removed from favorites',
    data: { favorite: fav, added },
  });
});

export const toggleFoodItem = asyncHandler(async (req, res) => {
  const foodItemId = req.body.foodItemId;
  if (!foodItemId) throw new ApiError(400, 'foodItemId is required');

  const foodItem = await FoodItem.findById(foodItemId);
  if (!foodItem) throw new ApiError(404, 'Food item not found');

  const fav = await getOrCreateFavorite(req.user._id);
  const idx = fav.foodItems.findIndex((id) => id.toString() === foodItemId);
  let added = false;

  if (idx >= 0) {
    fav.foodItems.splice(idx, 1);
  } else {
    fav.foodItems.push(foodItemId);
    added = true;
  }

  await fav.save();
  await fav.populate([
    { path: 'restaurants', select: 'name image rating cuisine location priceRange deliveryFee' },
    { path: 'foodItems', select: 'name image price isVegetarian restaurant isAvailable' },
  ]);

  res.json({
    success: true,
    message: added ? 'Food item added to favorites' : 'Food item removed from favorites',
    data: { favorite: fav, added },
  });
});

export const restaurantToggleValidators = [
  body('restaurantId').isMongoId().withMessage('Valid restaurantId is required'),
];

export const foodToggleValidators = [
  body('foodItemId').isMongoId().withMessage('Valid foodItemId is required'),
];
