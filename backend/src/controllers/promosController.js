import { body, param } from 'express-validator';
import Promo from '../models/Promo.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { resolvePromoDiscount, calcCartTotals } from '../services/orderService.js';
import Cart from '../models/Cart.js';
import Restaurant from '../models/Restaurant.js';

const isPromoLive = (promo) => {
  if (!promo?.isActive) return false;
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return false;
  return true;
};

export const listActivePromos = asyncHandler(async (req, res) => {
  const now = new Date();
  const items = await Promo.find({
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .sort({ discountPercent: -1 })
    .limit(20);

  res.json({
    success: true,
    message: 'Active promotions',
    data: items,
  });
});

export const validatePromo = asyncHandler(async (req, res) => {
  const code = req.body.code;
  let subtotal = Number(req.body.subtotal);

  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items?.length) {
      throw new ApiError(400, 'Cart is empty');
    }
    const restaurant = cart.restaurant
      ? await Restaurant.findById(cart.restaurant)
      : null;
    const totals = calcCartTotals(cart.items, restaurant?.deliveryFee);
    subtotal = totals.subtotal;
  }

  const result = await resolvePromoDiscount(code, subtotal);

  res.json({
    success: true,
    message: 'Promo applied',
    data: {
      code: result.promoCode,
      discountPercent: result.promo.discountPercent,
      discountAmount: result.discountAmount,
      minOrder: result.promo.minOrder,
      title: result.promo.title,
    },
  });
});

export const createPromo = asyncHandler(async (req, res) => {
  const promo = await Promo.create({
    title: req.body.title,
    description: req.body.description || '',
    code: String(req.body.code || '').toUpperCase(),
    discountPercent: req.body.discountPercent,
    minOrder: req.body.minOrder || 0,
    isActive: req.body.isActive !== false,
    expiresAt: req.body.expiresAt || null,
  });

  res.status(201).json({
    success: true,
    message: 'Promo created',
    data: promo,
  });
});

export const createValidators = [
  body('title').trim().notEmpty(),
  body('code').trim().notEmpty(),
  body('discountPercent').isFloat({ min: 1, max: 100 }),
  body('minOrder').optional().isFloat({ min: 0 }),
];

export const validatePromoValidators = [
  body('code').trim().notEmpty().withMessage('Promo code is required'),
  body('subtotal').optional().isFloat({ min: 0 }),
];

export const idParam = [param('id').isMongoId()];

export { isPromoLive };
