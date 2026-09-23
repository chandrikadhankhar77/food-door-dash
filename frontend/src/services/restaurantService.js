import api from './api';
import { unwrap } from '../utils/formatPrice';

export const restaurantService = {
  list: async (params = {}) => unwrap((await api.get('/restaurants', { params })).data),
  featured: async () => unwrap((await api.get('/restaurants/featured')).data),
  getById: async (id) => unwrap((await api.get(`/restaurants/${id}`)).data),
  getMenu: async (id) => unwrap((await api.get(`/menu/restaurants/${id}`)).data),
  popularFoods: async (params = {}) =>
    unwrap((await api.get('/menu/popular', { params })).data),
  getFoodItem: async (id) => unwrap((await api.get(`/menu/items/${id}`)).data),
};
