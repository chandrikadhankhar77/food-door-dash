import { body, param } from 'express-validator';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const updateProfileValidators = [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('avatar').optional().isString(),
];

export const addressValidators = [
  body('label').optional().isString(),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zip').trim().notEmpty().withMessage('Zip is required'),
  body('isDefault').optional().isBoolean(),
];

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'restaurant',
    'name image isActive'
  );
  res.json({ success: true, message: 'Profile fetched', data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'avatar'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, message: 'Profile updated', data: user });
});

export const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const ok = await user.comparePassword(req.body.currentPassword);
  if (!ok) throw new ApiError(400, 'Current password is incorrect');

  user.password = req.body.newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated', data: null });
});

export const listAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, message: 'Addresses fetched', data: user.addresses });
});

export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { label, street, city, state, zip, isDefault } = req.body;

  if (isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  user.addresses.push({
    label: label || 'Home',
    street,
    city,
    state,
    zip,
    isDefault: Boolean(isDefault) || user.addresses.length === 0,
  });

  await user.save();
  res.status(201).json({
    success: true,
    message: 'Address added',
    data: user.addresses,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');

  const fields = ['label', 'street', 'city', 'state', 'zip', 'isDefault'];
  for (const f of fields) {
    if (req.body[f] !== undefined) address[f] = req.body[f];
  }

  if (address.isDefault) {
    user.addresses.forEach((a) => {
      if (a._id.toString() !== address._id.toString()) a.isDefault = false;
    });
  }

  await user.save();
  res.json({ success: true, message: 'Address updated', data: user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found');

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json({ success: true, message: 'Address deleted', data: user.addresses });
});

export const addressIdParam = [param('addressId').isMongoId().withMessage('Invalid address id')];
