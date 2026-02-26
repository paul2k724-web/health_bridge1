import { Router } from 'express';
import reviewController from './review.controller.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.middleware.js';
import {
  createReviewSchema,
  providerReplySchema,
  bookingIdSchema,
  reviewIdSchema,
} from './review.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import {
  requireCustomer,
  requireProvider,
} from '../../shared/middleware/role.middleware.js';

const router = Router();

// Customer routes
router.post(
  '/bookings/:bookingId',
  protect,
  requireCustomer,
  validateParams(bookingIdSchema),
  validateBody(createReviewSchema),
  reviewController.createReview
);

router.get(
  '/bookings/:bookingId',
  protect,
  requireCustomer,
  validateParams(bookingIdSchema),
  reviewController.getBookingReview
);

router.get(
  '/bookings/:bookingId/can-review',
  protect,
  requireCustomer,
  validateParams(bookingIdSchema),
  reviewController.checkCanReview
);

router.get(
  '/my',
  protect,
  requireCustomer,
  reviewController.getCustomerReviews
);

// Provider routes
router.post(
  '/:reviewId/reply',
  protect,
  requireProvider,
  validateParams(reviewIdSchema),
  validateBody(providerReplySchema),
  reviewController.addProviderReply
);

// Public routes
router.get(
  '/providers/:providerProfileId',
  validateParams({ providerProfileId: { isMongoId: true } }),
  reviewController.getProviderReviews
);

export default router;
