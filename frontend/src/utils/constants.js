export const APP_NAME = 'FoodDash';

export const ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT_ADMIN: 'restaurant_admin',
  ADMIN: 'admin',
};

export const ORDER_STATUSES = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export const ORDER_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready_for_pickup: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

export const CUISINES = [
  'Italian',
  'Chinese',
  'Indian',
  'Mexican',
  'Japanese',
  'Thai',
  'American',
  'Mediterranean',
  'Korean',
  'Healthy',
  'Dessert',
  'Pizza',
  'Burgers',
  'Seafood',
];

/** Shared dish suggestions for navbar + restaurant filters */
export const QUICK_DISHES = [
  { label: 'Butter Chicken', cuisine: 'Indian', search: 'Butter Chicken' },
  { label: 'Samosa Plate', cuisine: 'Indian', search: 'Samosa' },
  { label: 'Margherita Pizza', cuisine: 'Pizza', search: 'Margherita' },
  { label: 'Pepperoni Feast', cuisine: 'Pizza', search: 'Pepperoni' },
  { label: 'Salmon Avocado Roll', cuisine: 'Japanese', search: 'Salmon' },
  { label: 'Tonkotsu Ramen', cuisine: 'Japanese', search: 'Ramen' },
  { label: 'Brisket Plate', cuisine: 'American', search: 'Brisket' },
  { label: 'Power Bowl', cuisine: 'Healthy', search: 'Bowl' },
  { label: 'Al Pastor Tacos', cuisine: 'Mexican', search: 'Tacos' },
  { label: 'Paneer Tikka Masala', cuisine: 'Indian', search: 'Paneer' },
];

/** Sample dish labels shown on Home cuisine cards (not restaurant names). */
export const CUISINE_DISHES = {
  Italian: 'Spaghetti Carbonara',
  Chinese: 'Chili Garlic Noodles',
  Indian: 'Butter Chicken',
  Mexican: 'Al Pastor Tacos',
  Japanese: 'Salmon Nigiri',
  Thai: 'Pad Thai',
  American: 'Smash Burger',
  Mediterranean: 'Power Bowl',
  Korean: 'Bibimbap',
  Healthy: 'Buddha Bowl',
  Dessert: 'Molten Lava Cake',
  Pizza: 'Margherita Pizza',
  Burgers: 'Classic Cheeseburger',
  Seafood: 'Grilled Prawns',
};

export const CUISINE_IMAGES = {
  Italian: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  Chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80',
  Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  Mexican: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80',
  Japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  Thai: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80',
  American: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  Mediterranean: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  Korean: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80',
  Healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  Dessert: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
  Pizza: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d264?w=400&q=80',
  Burgers: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
  Seafood: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80',
};

export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

export const PRICE_RANGE_OPTIONS = [
  { value: '$', label: 'Budget' },
  { value: '$$', label: 'Standard' },
  { value: '$$$', label: 'Premium' },
  { value: '$$$$', label: 'Luxury' },
];

export const SORT_OPTIONS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'deliveryFee', label: 'Delivery fee' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
];

export const PLACEHOLDER_FOOD =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
export const PLACEHOLDER_RESTAURANT =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80';

/** Unique dish image by dish name (avoids repeated/wrong photos on Home). */
export const DISH_IMAGES = {
  'Butter Chicken':
    'https://images.unsplash.com/photo-1603894584372-a73696270ac1?w=800&q=80',
  'Samosa Plate':
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  Margherita:
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d264?w=800&q=80',
  'Pepperoni Feast':
    'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
  'Salmon Avocado Roll':
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
  'Tonkotsu Ramen':
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
  'Mediterranean Power Bowl':
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  'Brisket Plate':
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80',
  'Al Pastor Tacos (3)':
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
  'Paneer Tikka Masala':
    'https://images.unsplash.com/photo-1565557623262-b51c2513a41f?w=800&q=80',
  'Spaghetti Carbonara':
    'https://images.unsplash.com/photo-1612874742237-990107322684?w=800&q=80',
  'Chicken Pakora':
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
  'St. Louis Ribs':
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
  'Vegan Buddha Bowl':
    'https://images.unsplash.com/photo-1511690657104-cdd9d4d0d0e3?w=800&q=80',
  'Veggie Burrito':
    'https://images.unsplash.com/photo-1626700051175-6814013eec90?w=800&q=80',
};

export const getDishImage = (name, fallback) => {
  if (!name) return fallback || PLACEHOLDER_FOOD;
  if (DISH_IMAGES[name]) return DISH_IMAGES[name];
  const key = Object.keys(DISH_IMAGES).find((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return (key && DISH_IMAGES[key]) || fallback || PLACEHOLDER_FOOD;
};

export const TOKEN_KEY = 'fooddash_token';
export const USER_KEY = 'fooddash_user';

export const TAX_RATE = 0.08;
export const DEFAULT_DELIVERY_FEE = 2.99;
