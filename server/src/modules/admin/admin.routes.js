import { Router } from 'express';
import adminController from './admin.controller.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.middleware.js';
import { objectId } from '../../shared/middleware/validate.middleware.js';
import {
  blockUserSchema,
  userIdSchema,
  userFilterSchema,
  exportFilterSchema,
} from './admin.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { requireAdmin } from '../../shared/middleware/role.middleware.js';

const router = Router();

router.use(protect);
router.use(requireAdmin);

router.get('/dashboard/stats', adminController.getDashboardStats);

router.get('/users', validateQuery(userFilterSchema), adminController.getAllUsers);

router.get('/users/:userId', validateParams(userIdSchema), adminController.getUserById);

router.patch(
  '/users/:userId/block',
  validateParams(userIdSchema),
  validateBody(blockUserSchema),
  adminController.blockUser
);

router.get('/bookings/export', validateQuery(exportFilterSchema), adminController.exportBookings);

router.get('/users/export', adminController.exportUsers);

router.get('/providers/export', adminController.exportProviders);

router.get('/analytics', adminController.getAnalytics);

export default router;
