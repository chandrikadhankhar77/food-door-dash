import api from './api';
import { unwrap } from '../utils/formatPrice';

export const orderService = {
  create: async (payload) => unwrap((await api.post('/orders', payload)).data),
  list: async (params = {}) => unwrap((await api.get('/orders/mine', { params })).data),
  getById: async (id) => unwrap((await api.get(`/orders/${id}`)).data),
  cancel: async (id) => unwrap((await api.patch(`/orders/${id}/cancel`)).data),
};
