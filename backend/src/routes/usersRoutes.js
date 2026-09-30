import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  changePasswordValidators,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateProfileValidators,
  addressValidators,
  addressIdParam,
} from '../controllers/usersController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidators, validate, updateProfile);
router.put('/password', changePasswordValidators, validate, changePassword);

router.get('/addresses', listAddresses);
router.post('/addresses', addressValidators, validate, addAddress);
router.put('/addresses/:addressId', addressIdParam, addressValidators, validate, updateAddress);
router.delete('/addresses/:addressId', addressIdParam, validate, deleteAddress);

export default router;
