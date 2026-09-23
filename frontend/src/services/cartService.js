import api from './api';
import { unwrap } from '../utils/formatPrice';

export const cartService = {
  get: async () => unwrap((await api.get('/cart')).data),
  addItem: async (payload) => unwrap((await api.post('/cart/items', payload)).data),
  updateItem: async (itemId, payload) =>
    unwrap((await api.put(`/cart/items/${itemId}`, payload)).data),
  removeItem: async (itemId) => unwrap((await api.delete(`/cart/items/${itemId}`)).data),
  clear: async () => unwrap((await api.delete('/cart')).data),
};
