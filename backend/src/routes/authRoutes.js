import { Router } from 'express';
import {
  register,
  login,
  me,
  registerValidators,
  loginValidators,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, registerValidators, validate, register);
router.post('/login', authLimiter, loginValidators, validate, login);
router.get('/me', protect, me);

export default router;
