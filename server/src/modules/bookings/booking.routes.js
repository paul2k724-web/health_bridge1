import { Router } from 'express';
import bookingController from './booking.controller.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middleware/validate.middleware.js';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  rescheduleBookingSchema,
  bookingIdSchema,
  bookingFilterSchema,
} from './booking.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import {
  requireCustomer,
  requireProvider,
  requireAdmin,
  requireCustomerOrAdmin,
} from '../../shared/middleware/role.middleware.js';
import { createBookingLimiter } from '../../shared/middleware/rate-limit.middleware.js';

const router = Router();

// Customer routes
router.post(
  '/',
  protect,
  requireCustomer,
  createBookingLimiter,
  validateBody(createBookingSchema),
  bookingController.createBooking
);

router.get(
  '/my',
  protect,
  requireCustomer,
  bookingController.getMyBookings
);

router.get(
  '/:id',
  protect,
  validateParams(bookingIdSchema),
  bookingController.getBookingById
);

router.patch(
  '/:id/cancel',
  protect,
  requireCustomer,
  validateParams(bookingIdSchema),
  bookingController.cancelBooking
);

router.patch(
  '/:id/reschedule',
  protect,
  requireCustomer,
  validateParams(bookingIdSchema),
  validateBody(rescheduleBookingSchema),
  bookingController.rescheduleBooking
);

router.get(
  '/:id/invoice',
  protect,
  validateParams(bookingIdSchema),
  bookingController.downloadInvoice
);

router.get(
  '/contact-info',
  bookingController.getContactInfo
);

// Admin routes
router.get(
  '/admin/all',
  protect,
  requireAdmin,
  validateQuery(bookingFilterSchema),
  bookingController.getAllBookings
);

router.patch(
  '/admin/:id/confirm',
  protect,
  requireAdmin,
  validateParams(bookingIdSchema),
  bookingController.confirmBooking
);

router.patch(
  '/admin/:id/status',
  protect,
  requireAdmin,
  validateParams(bookingIdSchema),
  validateBody(updateBookingStatusSchema),
  bookingController.updateBookingStatus
);

router.get(
  '/admin/stats',
  protect,
  requireAdmin,
  bookingController.getStats
);

export default router;
