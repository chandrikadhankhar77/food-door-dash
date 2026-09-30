import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import FoodItem from '../models/FoodItem.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  attachOrderTracking,
  createOrderFromCart,
  updateOrderStatus,
} from '../services/orderService.js';
import { emitOrderStatus, getIO } from '../sockets/orderSocket.js';

export const createOrderValidators = [
  body('deliveryAddress.street').trim().notEmpty(),
  body('deliveryAddress.city').trim().notEmpty(),
  body('deliveryAddress.state').trim().notEmpty(),
  body('deliveryAddress.zip').trim().notEmpty(),
  body('deliveryType').optional().isIn(['now', 'scheduled']),
  body('specialInstructions').optional().isString(),
];

export const statusValidators = [
  body('status')
    .isIn([
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ])
    .withMessage('Invalid status'),
  body('note').optional().isString(),
];

export const createOrder = asyncHandler(async (req, res) => {
  let deliveryAddress = req.body.deliveryAddress;

  if (req.body.addressId) {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.body.addressId);
    if (!addr) throw new ApiError(404, 'Address not found');
    deliveryAddress = {
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    };
  }

  const order = await createOrderFromCart({
    userId: req.user._id,
    deliveryAddress,
    deliveryType: req.body.deliveryType || 'now',
    scheduledDate: req.body.scheduledDate,
    scheduledTime: req.body.scheduledTime,
    deliveryWindow: req.body.deliveryWindow,
    specialInstructions: req.body.specialInstructions,
    promoCode: req.body.promoCode,
  });

  const io = getIO();
  if (io) {
    const restaurantId = order.restaurant._id || order.restaurant;
    io.to(`restaurant:${restaurantId}`).emit('order:new', order);
  }

  res.status(201).json({
    success: true,
    message: 'Order created',
    data: order,
  });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('restaurant', 'name image location'),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Orders fetched',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate(
      'restaurant',
      'name image location contact deliveryFee address coordinates'
    )
    .populate('user', 'name email phone')
    .populate('payment');

  if (!order) throw new ApiError(404, 'Order not found');

  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isRestaurantAdmin =
    req.user.role === 'restaurant_admin' &&
    (req.user.restaurant?.toString() === order.restaurant._id.toString() ||
      order.restaurant.owner?.toString() === req.user._id.toString());
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isRestaurantAdmin && !isAdmin) {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  const withTracking = await attachOrderTracking(order);
  res.json({ success: true, message: 'Order fetched', data: withTracking });
});

export const getRestaurantOrderStats = asyncHandler(async (req, res) => {
  let restaurantId = req.user.restaurant;

  if (req.user.role === 'admin' && req.query.restaurantId) {
    restaurantId = req.query.restaurantId;
  }

  if (!restaurantId) {
    throw new ApiError(400, 'No restaurant associated with this account');
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const restaurantObjectId = new mongoose.Types.ObjectId(String(restaurantId));

  const [ordersToday, revenueAgg, recentOrders, restaurant, menuItems] =
    await Promise.all([
      Order.countDocuments({
        restaurant: restaurantId,
        createdAt: { $gte: startOfDay },
        status: { $ne: 'cancelled' },
      }),
      Order.aggregate([
        {
          $match: {
            restaurant: restaurantObjectId,
            paymentStatus: 'paid',
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find({ restaurant: restaurantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name'),
      Restaurant.findById(restaurantId).select('rating'),
      FoodItem.countDocuments({ restaurant: restaurantId, isAvailable: true }),
    ]);

  res.json({
    success: true,
    message: 'Restaurant order stats',
    data: {
      ordersToday,
      revenue: revenueAgg[0]?.total || 0,
      menuItems,
      rating: restaurant?.rating || 0,
      recentOrders,
    },
  });
});

export const listRestaurantOrders = asyncHandler(async (req, res) => {
  let restaurantId = req.user.restaurant;

  if (req.user.role === 'admin' && req.query.restaurantId) {
    restaurantId = req.query.restaurantId;
  }

  if (!restaurantId) {
    throw new ApiError(400, 'No restaurant associated with this account');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { restaurant: restaurantId };
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email phone'),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Restaurant orders fetched',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const changeOrderStatus = asyncHandler(async (req, res) => {
  const order = await updateOrderStatus({
    orderId: req.params.id,
    status: req.body.status,
    note: req.body.note,
    actor: req.user,
    io: getIO(),
  });

  res.json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('restaurant');
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new ApiError(400, 'Order can only be cancelled before preparation');
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    at: new Date(),
    note: req.body.note || 'Cancelled by customer',
  });
  await order.save();

  emitOrderStatus(getIO(), order);

  res.json({ success: true, message: 'Order cancelled', data: order });
});

export const idParam = [param('id').isMongoId().withMessage('Invalid order id')];
