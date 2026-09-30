import api from './api';
import { unwrap } from '../utils/formatPrice';

export const notificationService = {
  list: async (params = {}) => unwrap((await api.get('/notifications', { params })).data),
  unreadCount: async () => unwrap((await api.get('/notifications/unread-count')).data),
  markRead: async (id) => unwrap((await api.patch(`/notifications/${id}/read`)).data),
  markAllRead: async () => unwrap((await api.patch('/notifications/read-all')).data),
};
