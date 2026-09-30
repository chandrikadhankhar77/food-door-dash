import api from './api';
import { unwrap } from '../utils/formatPrice';

export const promoService = {
  list: async () => unwrap((await api.get('/promos')).data),
  validate: async (payload) =>
    unwrap((await api.post('/promos/validate', payload)).data),
};
