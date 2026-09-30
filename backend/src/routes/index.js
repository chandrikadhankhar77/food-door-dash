import { Router } from 'express';
import authRoutes from './authRoutes.js';
import usersRoutes from './usersRoutes.js';
import restaurantsRoutes from './restaurantsRoutes.js';
import menuRoutes from './menuRoutes.js';
import cartRoutes from './cartRoutes.js';
import ordersRoutes from './ordersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';
import reviewsRoutes from './reviewsRoutes.js';
import notificationsRoutes from './notificationsRoutes.js';
import favoritesRoutes from './favoritesRoutes.js';
import promosRoutes from './promosRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    data: { uptime: process.uptime() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/restaurants', restaurantsRoutes);
router.use('/menu', menuRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/promos', promosRoutes);

export default router;
