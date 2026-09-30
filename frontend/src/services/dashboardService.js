import api from './api';
import { unwrap } from '../utils/formatPrice';

let restaurantCache = null;

const getMine = async (force = false) => {
  if (!force && restaurantCache) return restaurantCache;
  const data = unwrap((await api.get('/restaurants/mine')).data);
  restaurantCache = data?.restaurant || data;
  return restaurantCache;
};

const restaurantId = async () => {
  const restaurant = await getMine();
  const id = restaurant?._id || restaurant?.id;
  if (!id) throw new Error('No restaurant linked to this account');
  return id;
};

export const dashboardService = {
  clearCache: () => {
    restaurantCache = null;
  },

  stats: async () =>
    unwrap((await api.get('/orders/restaurant/stats')).data),

  getRestaurant: async () => {
    try {
      return await getMine(true);
    } catch {
      restaurantCache = null;
      return null;
    }
  },

  createRestaurant: async (payload) => {
    const data = unwrap((await api.post('/restaurants', payload)).data);
    restaurantCache = data?.restaurant || data;
    return restaurantCache;
  },

  updateRestaurant: async (payload) => {
    try {
      const id = await restaurantId();
      const data = unwrap((await api.put(`/restaurants/${id}`, payload)).data);
      restaurantCache = data?.restaurant || data;
      return restaurantCache;
    } catch (error) {
      // New restaurant partners may not have a linked restaurant yet
      if (error?.response?.status === 404 || error?.message?.includes('No restaurant')) {
        return dashboardService.createRestaurant(payload);
      }
      throw error;
    }
  },

  listCategories: async () => {
    const id = await restaurantId();
    return unwrap((await api.get(`/menu/restaurants/${id}/categories`)).data);
  },
  createCategory: async (payload) => {
    const id = await restaurantId();
    return unwrap((await api.post(`/menu/restaurants/${id}/categories`, payload)).data);
  },
  updateCategory: async (categoryId, payload) =>
    unwrap((await api.put(`/menu/categories/${categoryId}`, payload)).data),
  deleteCategory: async (categoryId) =>
    unwrap((await api.delete(`/menu/categories/${categoryId}`)).data),

  listMenuItems: async (params = {}) => {
    const id = await restaurantId();
    return unwrap((await api.get(`/menu/restaurants/${id}/items`, { params })).data);
  },
  createMenuItem: async (payload) => {
    const id = await restaurantId();
    return unwrap((await api.post(`/menu/restaurants/${id}/items`, payload)).data);
  },
  updateMenuItem: async (itemId, payload) =>
    unwrap((await api.put(`/menu/items/${itemId}`, payload)).data),
  deleteMenuItem: async (itemId) =>
    unwrap((await api.delete(`/menu/items/${itemId}`)).data),

  listOrders: async (params = {}) =>
    unwrap((await api.get('/orders/restaurant', { params })).data),
  updateOrderStatus: async (orderId, payload) =>
    unwrap((await api.patch(`/orders/${orderId}/status`, payload)).data),

  listReviews: async (params = {}) =>
    unwrap((await api.get('/reviews/manage', { params })).data),
  moderateReview: async (reviewId, payload) => {
    const status = payload.status || payload.moderationStatus;
    if (status) {
      return unwrap(
        (await api.patch(`/reviews/${reviewId}/moderate`, { status })).data
      );
    }
    return unwrap(
      (await api.patch(`/reviews/${reviewId}/respond`, {
        adminResponse: payload.adminResponse,
      })).data
    );
  },
  respondToReview: async (reviewId, payload) =>
    unwrap((await api.patch(`/reviews/${reviewId}/respond`, payload)).data),
};
