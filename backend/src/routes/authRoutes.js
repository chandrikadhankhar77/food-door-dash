import { Router } from 'express';
import {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, registerValidators, validate, register);
router.post('/login', authLimiter, loginValidators, validate, login);
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidators,
  validate,
  forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidators,
  validate,
  resetPassword
);
router.get('/me', protect, me);

export default router;
