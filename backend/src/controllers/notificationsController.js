import { param } from 'express-validator';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedOrder', 'status total'),
    Notification.countDocuments(filter),
  ]);

  res.json({
    success: true,
    message: 'Notifications fetched',
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });
  res.json({ success: true, message: 'Unread count', data: { count } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) throw new ApiError(404, 'Notification not found');

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, message: 'Notification marked as read', data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: { modifiedCount: result.modifiedCount },
  });
});

export const idParam = [param('id').isMongoId().withMessage('Invalid notification id')];
