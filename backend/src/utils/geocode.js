/** City centers used when full geocoding is unavailable */
const CITY_COORDS = {
  austin: { lat: 30.2672, lng: -97.7431 },
  houston: { lat: 29.7604, lng: -95.3698 },
  dallas: { lat: 32.7767, lng: -96.797 },
  'san antonio': { lat: 29.4241, lng: -98.4936 },
  'fort worth': { lat: 32.7555, lng: -97.3308 },
};

const DEFAULT_COORDS = { lat: 30.2672, lng: -97.7431 };

/** Stable tiny offset from a string so nearby addresses don't stack exactly */
const hashOffset = (text = '') => {
  let hash = 0;
  const str = String(text);
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const lat = ((hash % 200) / 10000) * (hash % 2 === 0 ? 1 : -1);
  const lng = ((((hash >> 8) % 200) / 10000) * (hash % 3 === 0 ? 1 : -1));
  return { lat, lng };
};

export const formatAddress = (address = {}) => {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.location,
  ].filter(Boolean);
  return parts.join(', ');
};

/**
 * Resolve lat/lng for an address.
 * Uses city fallbacks + deterministic street offset (works offline, no API key).
 * Optional Nominatim lookup can be enabled later via USE_NOMINATIM=true.
 */
export const geocodeAddress = async (address = {}) => {
  if (
    address?.lat != null &&
    address?.lng != null &&
    !Number.isNaN(Number(address.lat)) &&
    !Number.isNaN(Number(address.lng))
  ) {
    return { lat: Number(address.lat), lng: Number(address.lng) };
  }

  if (
    address?.coordinates?.lat != null &&
    address?.coordinates?.lng != null
  ) {
    return {
      lat: Number(address.coordinates.lat),
      lng: Number(address.coordinates.lng),
    };
  }

  const cityKey = String(address.city || address.location || '')
    .trim()
    .toLowerCase();
  const base = CITY_COORDS[cityKey] || DEFAULT_COORDS;
  const offset = hashOffset(formatAddress(address) || cityKey);

  return {
    lat: Math.round((base.lat + offset.lat) * 100000) / 100000,
    lng: Math.round((base.lng + offset.lng) * 100000) / 100000,
  };
};

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
  return {
    lat: from.lat + (to.lat - from.lat) * p,
    lng: from.lng + (to.lng - from.lng) * p,
  };
};

export const buildTrackingPayload = async ({ restaurant, deliveryAddress, status }) => {
  const restaurantCoords =
    restaurant?.coordinates?.lat != null && restaurant?.coordinates?.lng != null
      ? {
          lat: Number(restaurant.coordinates.lat),
          lng: Number(restaurant.coordinates.lng),
        }
      : await geocodeAddress({
          ...(restaurant?.address || {}),
          location: restaurant?.location,
        });

  const deliveryCoords = await geocodeAddress(deliveryAddress || {});
  const progress = progressForStatus(status);
  const driverCoords = interpolateCoords(restaurantCoords, deliveryCoords, progress);

  return {
    restaurantCoords,
    deliveryCoords,
    driverCoords,
    progress,
    provider: 'simulated',
  };
};
