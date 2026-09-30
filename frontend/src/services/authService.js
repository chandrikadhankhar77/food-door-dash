import api from './api';
import { unwrap } from '../utils/formatPrice';

export const authService = {
  register: async (payload) => unwrap((await api.post('/auth/register', payload)).data),
  login: async (payload) => unwrap((await api.post('/auth/login', payload)).data),
  forgotPassword: async (payload) =>
    unwrap((await api.post('/auth/forgot-password', payload)).data),
  resetPassword: async (payload) =>
    unwrap((await api.post('/auth/reset-password', payload)).data),
  me: async () => unwrap((await api.get('/auth/me')).data),
  updateProfile: async (payload) =>
    unwrap((await api.put('/users/profile', payload)).data),
  changePassword: async (payload) =>
    unwrap((await api.put('/users/password', payload)).data),
  addAddress: async (payload) =>
    unwrap((await api.post('/users/addresses', payload)).data),
  updateAddress: async (id, payload) =>
    unwrap((await api.put(`/users/addresses/${id}`, payload)).data),
  deleteAddress: async (id) =>
    unwrap((await api.delete(`/users/addresses/${id}`)).data),
};
