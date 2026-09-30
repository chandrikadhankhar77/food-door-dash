export const progressForStatus = (status) => {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 0.05;
    case 'preparing':
      return 0.18;
    case 'ready_for_pickup':
      return 0.28;
    case 'out_for_delivery':
      return 0.72;
    case 'delivered':
      return 1;
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
};

export const interpolateCoords = (from, to, t) => {
  const p = Math.min(Math.max(Number(t) || 0, 0), 1);
  if (!from || !to) return from || to || null;
  return {
    lat: from.lat + (to.lat - from.lat) * p,
    lng: from.lng + (to.lng - from.lng) * p,
  };
};

export const statusLabel = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const trackingMessage = (status) => {
  switch (status) {
    case 'pending':
      return 'Order placed — waiting for restaurant confirmation';
    case 'confirmed':
      return 'Restaurant confirmed — preparing your kitchen ticket';
    case 'preparing':
      return 'Kitchen is preparing your food';
    case 'ready_for_pickup':
      return 'Food is ready — courier picking up soon';
    case 'out_for_delivery':
      return 'Courier is on the way to you';
    case 'delivered':
      return 'Delivered — enjoy your meal!';
    case 'cancelled':
      return 'This order was cancelled';
    default:
      return 'Tracking your order';
  }
};

/** Prefer server tracking payload; otherwise derive from order fields */
export const resolveTracking = (order) => {
  if (!order) return null;
  if (order.tracking?.restaurantCoords && order.tracking?.deliveryCoords) {
    const progress =
      order.tracking.progress ?? progressForStatus(order.status);
    return {
      ...order.tracking,
      progress,
      driverCoords:
        order.tracking.driverCoords ||
        interpolateCoords(
          order.tracking.restaurantCoords,
          order.tracking.deliveryCoords,
          progress
        ),
    };
  }

  const restaurantCoords =
    order.restaurant?.coordinates ||
    (order.restaurant?.address?.lat != null
      ? {
          lat: order.restaurant.address.lat,
          lng: order.restaurant.address.lng,
        }
      : null);
  const deliveryCoords =
    order.deliveryAddress?.lat != null
      ? { lat: order.deliveryAddress.lat, lng: order.deliveryAddress.lng }
      : null;

  if (!restaurantCoords || !deliveryCoords) return null;

  const progress = progressForStatus(order.status);
  return {
    restaurantCoords,
    deliveryCoords,
    driverCoords: interpolateCoords(restaurantCoords, deliveryCoords, progress),
    progress,
    provider: 'simulated',
  };
};
