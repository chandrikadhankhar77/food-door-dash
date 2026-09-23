import { body } from 'express-validator';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional().isString(),
  body('role')
    .optional()
    .isIn(['customer', 'restaurant_admin'])
    .withMessage('Role must be customer or restaurant_admin'),
];

export const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new ApiError(400, 'Email already registered');
  }

  // Never allow self-signup as platform admin
  const safeRole = role === 'restaurant_admin' ? 'restaurant_admin' : 'customer';

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: safeRole,
  });

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id, user.role);
  await user.populate('restaurant', 'name image isActive');

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        restaurant: user.restaurant,
        avatar: user.avatar,
      },
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'restaurant',
    'name image isActive'
  );

  res.json({
    success: true,
    message: 'Current user',
    data: user,
  });
});
