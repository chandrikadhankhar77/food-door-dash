import api from './api';
import { unwrap } from '../utils/formatPrice';

export const favoriteService = {
  get: async () => unwrap((await api.get('/favorites')).data),
  toggleRestaurant: async (id) =>
    unwrap((await api.post('/favorites/restaurants/toggle', { restaurantId: id })).data),
  removeRestaurant: async (id) =>
    unwrap((await api.post('/favorites/restaurants/toggle', { restaurantId: id })).data),
  toggleFoodItem: async (id) =>
    unwrap((await api.post('/favorites/food-items/toggle', { foodItemId: id })).data),
  removeFoodItem: async (id) =>
    unwrap((await api.post('/favorites/food-items/toggle', { foodItemId: id })).data),
};
