import api from './api';
import { unwrap } from '../utils/formatPrice';

export const paymentService = {
  getConfig: async () => unwrap((await api.get('/payments/config')).data),
  createIntent: async (payload) =>
    unwrap((await api.post('/payments/create-intent', payload)).data),
  createCheckoutSession: async (payload) =>
    unwrap((await api.post('/payments/create-checkout-session', payload)).data),
  payCod: async (payload) => unwrap((await api.post('/payments/cod', payload)).data),
  confirm: async (payload) => unwrap((await api.post('/payments/confirm', payload)).data),
  confirmCheckout: async (payload) =>
    unwrap((await api.post('/payments/confirm-checkout', payload)).data),
  history: async (params = {}) =>
    unwrap((await api.get('/payments/history', { params })).data),
  methods: async () => unwrap((await api.get('/payments/methods')).data),
  removeMethod: async (id) =>
    unwrap((await api.delete(`/payments/methods/${id}`)).data),
};
