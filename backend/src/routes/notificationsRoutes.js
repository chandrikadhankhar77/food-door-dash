import { Router } from 'express';
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  idParam,
} from '../controllers/notificationsController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', idParam, validate, markRead);

export default router;
