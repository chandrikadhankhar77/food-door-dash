import api from './api';
import { unwrap } from '../utils/formatPrice';

export const reviewService = {
  byRestaurant: async (restaurantId, params = {}) =>
    unwrap((await api.get(`/reviews/restaurant/${restaurantId}`, { params })).data),
  create: async (payload) => unwrap((await api.post('/reviews', payload)).data),
};
