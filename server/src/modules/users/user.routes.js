import { Router } from 'express';
import userController from './user.controller.js';
import bookingController from '../bookings/booking.controller.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.middleware.js';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
} from './user.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { requireCustomer } from '../../shared/middleware/role.middleware.js';

const router = Router();

router.use(protect);
router.use(requireCustomer);

router.get('/profile', userController.getProfile);

router.get('/addresses', userController.getAddresses);
router.post('/addresses', validateBody(createAddressSchema), userController.addAddress);
router.put('/addresses/:id', validateParams(addressIdSchema), validateBody(updateAddressSchema), userController.updateAddress);
router.delete('/addresses/:id', validateParams(addressIdSchema), userController.deleteAddress);
router.patch('/addresses/:id/default', validateParams(addressIdSchema), userController.setDefaultAddress);

router.get('/bookings', bookingController.getMyBookings);

export default router;
