import { body, param } from 'express-validator';
import Cart from '../models/Cart.js';
import FoodItem from '../models/FoodItem.js';
import Restaurant from '../models/Restaurant.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calcCartTotals } from '../services/orderService.js';

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], restaurant: null });
  }
  return cart;
};

export const addValidators = [
  body('foodItemId').isMongoId().withMessage('Valid food item id is required'),
  body('quantity').optional().isInt({ min: 1 }),
  body('addOns').optional().isArray(),
  body('specialInstructions').optional().isString(),
  body('clearExisting').optional().isBoolean(),
];

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate([
    { path: 'restaurant', select: 'name image deliveryFee location' },
    { path: 'items.foodItem', select: 'name image price isAvailable' },
  ]);

  let totals = { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 };
  if (cart.restaurant) {
    const fee = cart.restaurant.deliveryFee;
    totals = calcCartTotals(cart.items, fee);
  }

  res.json({
    success: true,
    message: 'Cart fetched',
    data: { cart, totals },
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { foodItemId, quantity = 1, addOns = [], specialInstructions, clearExisting } =
    req.body;

  const foodItem = await FoodItem.findById(foodItemId);
  if (!foodItem || !foodItem.isAvailable) {
    throw new ApiError(404, 'Food item not available');
  }

  const restaurant = await Restaurant.findById(foodItem.restaurant);
  if (!restaurant || !restaurant.isActive) {
    throw new ApiError(400, 'Restaurant is not available');
  }

  const cart = await getOrCreateCart(req.user._id);

  if (
    cart.restaurant &&
    cart.items.length > 0 &&
    cart.restaurant.toString() !== foodItem.restaurant.toString()
  ) {
    if (!clearExisting) {
      return res.status(409).json({
        success: false,
        message:
          'Cart contains items from another restaurant. Clear the cart to add this item.',
        code: 'CART_RESTAURANT_CONFLICT',
        data: {
          currentRestaurant: cart.restaurant,
          attemptedRestaurant: foodItem.restaurant,
        },
      });
    }
    cart.items = [];
    cart.restaurant = null;
  }

  cart.restaurant = foodItem.restaurant;

  const normalizedAddOns = (addOns || [])
    .map((a) => {
      if (a._id || a.id) {
        const found = foodItem.addOns.id(a._id || a.id);
        if (found) return { name: found.name, price: found.price };
      }
      if (a.name) {
        const found = foodItem.addOns.find(
          (x) => x.name.toLowerCase() === String(a.name).toLowerCase()
        );
        if (found) return { name: found.name, price: found.price };
        return { name: a.name, price: Number(a.price) || 0 };
      }
      return null;
    })
    .filter(Boolean);

  const addOnsKey = JSON.stringify(
    normalizedAddOns.map((a) => ({ name: a.name, price: a.price })).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  );

  const existing = cart.items.find((item) => {
    if (item.foodItem.toString() !== foodItem._id.toString()) return false;
    const key = JSON.stringify(
      (item.addOns || [])
        .map((a) => ({ name: a.name, price: a.price }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    return key === addOnsKey;
  });

  if (existing) {
    existing.quantity += Number(quantity);
    if (specialInstructions !== undefined) {
      existing.specialInstructions = specialInstructions;
    }
  } else {
    cart.items.push({
      foodItem: foodItem._id,
      name: foodItem.name,
      price: foodItem.price,
      quantity: Number(quantity),
      addOns: normalizedAddOns,
      specialInstructions: specialInstructions || '',
    });
  }

  await cart.save();
  await cart.populate([
    { path: 'restaurant', select: 'name image deliveryFee location' },
    { path: 'items.foodItem', select: 'name image price isAvailable' },
  ]);

  const totals = calcCartTotals(cart.items, restaurant.deliveryFee);

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: { cart, totals },
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  item.quantity = Number(quantity);
  if (req.body.specialInstructions !== undefined) {
    item.specialInstructions = req.body.specialInstructions;
  }

  await cart.save();
  await cart.populate([
    { path: 'restaurant', select: 'name image deliveryFee location' },
    { path: 'items.foodItem', select: 'name image price isAvailable' },
  ]);

  const fee = cart.restaurant?.deliveryFee;
  const totals = calcCartTotals(cart.items, fee);

  res.json({
    success: true,
    message: 'Cart item updated',
    data: { cart, totals },
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  item.deleteOne();
  if (cart.items.length === 0) cart.restaurant = null;
  await cart.save();

  await cart.populate([
    { path: 'restaurant', select: 'name image deliveryFee location' },
    { path: 'items.foodItem', select: 'name image price isAvailable' },
  ]);

  const totals = cart.items.length
    ? calcCartTotals(cart.items, cart.restaurant?.deliveryFee)
    : { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 };

  res.json({
    success: true,
    message: 'Cart item removed',
    data: { cart, totals },
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.restaurant = null;
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: {
      cart,
      totals: { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 },
    },
  });
});

export const itemIdParam = [param('itemId').isMongoId().withMessage('Invalid item id')];
