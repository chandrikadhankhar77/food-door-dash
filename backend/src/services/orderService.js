import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Promo from '../models/Promo.js';
import ApiError from '../utils/ApiError.js';
import { buildTrackingPayload, geocodeAddress } from '../utils/geocode.js';
import { notifyOrderStatus } from './notificationService.js';
import { emitOrderStatus } from '../sockets/orderSocket.js';

const TAX_RATE = () => Number(process.env.TAX_RATE || 0.08);
const DEFAULT_DELIVERY_FEE = () => Number(process.env.DEFAULT_DELIVERY_FEE || 2.99);
const DEFAULT_ETA_MINUTES = () => Number(process.env.DEFAULT_ETA_MINUTES || 35);

export const calcCartTotals = (items, deliveryFee, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const addOnTotal = (item.addOns || []).reduce((a, x) => a + Number(x.price), 0);
    return sum + (Number(item.price) + addOnTotal) * Number(item.quantity);
  }, 0);
  const fee = Number(deliveryFee ?? DEFAULT_DELIVERY_FEE());
  const discount = Math.min(Math.max(Number(discountAmount) || 0, 0), subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE() * 100) / 100;
  const total = Math.round((taxable + fee + tax) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: fee,
    discountAmount: Math.round(discount * 100) / 100,
    tax,
    total,
  };
};

export const resolvePromoDiscount = async (promoCode, subtotal) => {
  if (!promoCode) {
    return { promoCode: '', discountAmount: 0, promo: null };
  }

  const code = String(promoCode).trim().toUpperCase();
  const promo = await Promo.findOne({ code, isActive: true });
  if (!promo) {
    throw new ApiError(400, 'Invalid promo code');
  }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'This promo code has expired');
  }
  if (subtotal < Number(promo.minOrder || 0)) {
    throw new ApiError(
      400,
      `Promo requires a minimum subtotal of $${Number(promo.minOrder).toFixed(2)}`
    );
  }

  const discountAmount =
    Math.round(subtotal * (Number(promo.discountPercent) / 100) * 100) / 100;

  return { promoCode: promo.code, discountAmount, promo };
};

export const computeEstimatedDeliveryAt = ({
  deliveryType = 'now',
  scheduledDate,
  scheduledTime,
}) => {
  if (deliveryType === 'scheduled' && scheduledDate && scheduledTime) {
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    if (!Number.isNaN(scheduledAt.getTime())) {
      return scheduledAt;
    }
  }
  return new Date(Date.now() + DEFAULT_ETA_MINUTES() * 60 * 1000);
};

export const createOrderFromCart = async ({
  userId,
  deliveryAddress,
  deliveryType = 'now',
  scheduledDate,
  scheduledTime,
  deliveryWindow,
  specialInstructions,
  promoCode,
}) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items.length) {
    throw new ApiError(400, 'Cart is empty');
  }
  if (!cart.restaurant) {
    throw new ApiError(400, 'Cart has no restaurant');
  }

  const restaurant = await Restaurant.findById(cart.restaurant);
  if (!restaurant || !restaurant.isActive) {
    throw new ApiError(400, 'Restaurant is not available');
  }

  if (!deliveryAddress?.street || !deliveryAddress?.city || !deliveryAddress?.state || !deliveryAddress?.zip) {
    throw new ApiError(400, 'Valid delivery address is required');
  }

  if (deliveryType === 'scheduled') {
    if (!scheduledDate || !scheduledTime) {
      throw new ApiError(400, 'Scheduled date and time are required for scheduled delivery');
    }
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new ApiError(400, 'Invalid scheduled date or time');
    }
    if (scheduledAt.getTime() < Date.now()) {
      throw new ApiError(400, 'Scheduled delivery must be in the future');
    }
  }

  const baseTotals = calcCartTotals(cart.items, restaurant.deliveryFee, 0);
  const promo = await resolvePromoDiscount(promoCode, baseTotals.subtotal);
  const totals = calcCartTotals(cart.items, restaurant.deliveryFee, promo.discountAmount);
  const estimatedDeliveryAt = computeEstimatedDeliveryAt({
    deliveryType,
    scheduledDate,
    scheduledTime,
  });

  const deliveryCoords = await geocodeAddress(deliveryAddress);
  const addressWithCoords = {
    ...deliveryAddress,
    lat: deliveryCoords.lat,
    lng: deliveryCoords.lng,
  };

  // Ensure restaurant has coordinates for map tracking
  if (restaurant.coordinates?.lat == null || restaurant.coordinates?.lng == null) {
    restaurant.coordinates = await geocodeAddress({
      ...(restaurant.address || {}),
      location: restaurant.location,
    });
    await restaurant.save();
  }

  const order = await Order.create({
    user: userId,
    restaurant: restaurant._id,
    items: cart.items.map((item) => ({
      foodItem: item.foodItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      addOns: item.addOns,
      specialInstructions: item.specialInstructions,
    })),
    deliveryAddress: addressWithCoords,
    deliveryType,
    scheduledDate,
    scheduledTime,
    deliveryWindow,
    estimatedDeliveryAt,
    promoCode: promo.promoCode,
    specialInstructions,
    ...totals,
    status: 'pending',
    paymentStatus: 'pending',
  });

  cart.items = [];
  cart.restaurant = null;
  await cart.save();

  const populated = await order.populate([
    {
      path: 'restaurant',
      select: 'name image deliveryFee location address coordinates',
    },
    { path: 'user', select: 'name email phone' },
  ]);

  const tracking = await buildTrackingPayload({
    restaurant: populated.restaurant,
    deliveryAddress: populated.deliveryAddress,
    status: populated.status,
  });

  const result = populated.toObject();
  result.tracking = tracking;
  return result;
};

export const attachOrderTracking = async (orderDoc) => {
  if (!orderDoc) return orderDoc;
  const order =
    typeof orderDoc.toObject === 'function' ? orderDoc.toObject() : { ...orderDoc };

  // Backfill delivery coords on older orders
  if (
    order.deliveryAddress &&
    (order.deliveryAddress.lat == null || order.deliveryAddress.lng == null)
  ) {
    const coords = await geocodeAddress(order.deliveryAddress);
    order.deliveryAddress.lat = coords.lat;
    order.deliveryAddress.lng = coords.lng;
    await Order.findByIdAndUpdate(order._id, {
      'deliveryAddress.lat': coords.lat,
      'deliveryAddress.lng': coords.lng,
    });
  }

  order.tracking = await buildTrackingPayload({
    restaurant: order.restaurant,
    deliveryAddress: order.deliveryAddress,
    status: order.status,
  });
  return order;
};

export const updateOrderStatus = async ({
  orderId,
  status,
  note,
  actor,
  io,
}) => {
  const allowed = [
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  if (!allowed.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findById(orderId).populate('restaurant');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (actor.role === 'restaurant_admin') {
    const restaurantId = actor.restaurant?.toString() || actor.restaurant;
    if (order.restaurant._id.toString() !== String(restaurantId)) {
      throw new ApiError(403, 'Not authorized to update this order');
    }
  }

  if (order.status === 'cancelled' || order.status === 'delivered') {
    throw new ApiError(400, `Cannot update a ${order.status} order`);
  }

  order.status = status;
  order.statusHistory.push({
    status,
    at: new Date(),
    note: note || `Status changed to ${status}`,
  });
  await order.save();

  const withTracking = await attachOrderTracking(order);
  emitOrderStatus(io, order, withTracking.tracking);
  await notifyOrderStatus(order, io);

  return withTracking;
};
