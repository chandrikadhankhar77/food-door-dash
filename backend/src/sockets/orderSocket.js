import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

let ioInstance = null;

export const getIO = () => ioInstance;

export const initSockets = (httpServer) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      null;

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      return next();
    } catch {
      return next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on('join:user', (userId) => {
      if (socket.user?.id && String(socket.user.id) === String(userId)) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('join:restaurant', (restaurantId) => {
      if (
        socket.user &&
        (socket.user.role === 'restaurant_admin' || socket.user.role === 'admin')
      ) {
        socket.join(`restaurant:${restaurantId}`);
      }
    });

    socket.on('join:order', (orderId) => {
      if (socket.user?.id) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });
  });

  ioInstance = io;
  return io;
};

export const emitOrderStatus = (io, order, tracking = null) => {
  if (!io || !order) return;

  const restaurantId = order.restaurant?._id || order.restaurant;
  const userId = order.user?._id || order.user;
  const payload = {
    orderId: order._id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    restaurantId,
    userId,
    updatedAt: order.updatedAt,
    statusHistory: order.statusHistory,
    tracking: tracking || order.tracking || null,
  };

  io.to(`order:${order._id}`).emit('order:status', payload);
  io.to(`user:${userId}`).emit('order:status', payload);
  if (restaurantId) {
    io.to(`restaurant:${restaurantId}`).emit('order:status', payload);
  }
};
