import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  relatedOrder = null,
  io = null,
}) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    relatedOrder,
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  return notification;
};

export const notifyOrderStatus = async (order, io) => {
  const title = 'Order update';
  const message = `Your order status is now: ${order.status.replace(/_/g, ' ')}`;

  return createNotification({
    userId: order.user._id || order.user,
    title,
    message,
    type: 'order',
    relatedOrder: order._id,
    io,
  });
};
