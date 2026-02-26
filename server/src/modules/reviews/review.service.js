import mongoose from 'mongoose';
import Review from '../../models/Review.model.js';
import Booking from '../../models/Booking.model.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import { USER_ROLES, BOOKING_STATUS } from '../../config/constants.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors/index.js';
import logger from '../../shared/utils/logger.js';

class ReviewService {
  async createReview(bookingId, customerId, reviewData) {
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('provider');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer.toString() !== customerId.toString()) {
      throw new ForbiddenError('You can only review your own bookings');
    }

    if (booking.status !== BOOKING_STATUS.COMPLETED) {
      throw new ValidationError('You can only review completed bookings');
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      throw new ConflictError('You have already reviewed this booking');
    }

    if (!booking.provider) {
      throw new ValidationError('No provider assigned to this booking');
    }

    const review = await Review.create({
      booking: bookingId,
      customer: customerId,
      provider: booking.provider._id,
      providerProfile: booking.providerProfile,
      service: booking.service._id,
      rating: reviewData.rating,
      review: reviewData.review,
      aspects: reviewData.aspects || {},
      isPublic: true,
    });

    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        'rating.score': reviewData.rating,
        'rating.review': reviewData.review,
        'rating.aspects': reviewData.aspects || {},
        'rating.ratedAt': new Date(),
      },
    });

    await AuditLog.create({
      action: 'REVIEW_CREATED',
      actor: { userId: customerId, role: USER_ROLES.CUSTOMER },
      target: { type: 'Review', id: review._id },
      metadata: {
        bookingId,
        providerId: booking.provider._id,
        rating: reviewData.rating,
      },
    });

    logger.info('Review created', {
      reviewId: review._id,
      bookingId,
      rating: reviewData.rating,
    });

    return await Review.findById(review._id)
      .populate('customer', 'name avatar')
      .populate('service', 'name');
  }

  async getBookingReview(bookingId, customerId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer.toString() !== customerId.toString()) {
      throw new ForbiddenError('Access denied');
    }

    const review = await Review.findOne({ booking: bookingId })
      .populate('customer', 'name avatar')
      .populate('service', 'name');

    return review;
  }

  async getProviderReviews(providerProfileId, options = {}) {
    const query = {
      providerProfile: providerProfileId,
      isPublic: true,
      isDeleted: false,
    };

    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('customer', 'name avatar')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    const stats = await Review.getProviderStats(providerProfileId);

    return {
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerReviews(customerId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const query = {
      customer: customerId,
      isDeleted: false,
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('service', 'name duration')
        .populate({
          path: 'booking',
          select: 'scheduledDate scheduledTime',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(query),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addProviderReply(reviewId, providerId, replyText) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const providerProfile = await ProviderProfile.findOne({ user: providerId });
    if (!providerProfile || review.providerProfile.toString() !== providerProfile._id.toString()) {
      throw new ForbiddenError('You can only reply to reviews for your services');
    }

    if (review.providerReply?.text) {
      throw new ConflictError('You have already replied to this review');
    }

    review.providerReply = {
      text: replyText,
      repliedAt: new Date(),
    };

    await review.save();

    await AuditLog.create({
      action: 'REVIEW_REPLY_ADDED',
      actor: { userId: providerId, role: USER_ROLES.PROVIDER },
      target: { type: 'Review', id: review._id },
      metadata: { replyLength: replyText.length },
    });

    return await Review.findById(reviewId)
      .populate('customer', 'name avatar')
      .populate('service', 'name');
  }

  async checkCanReview(bookingId, customerId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return { canReview: false, reason: 'Booking not found' };
    }

    if (booking.customer.toString() !== customerId.toString()) {
      return { canReview: false, reason: 'Not your booking' };
    }

    if (booking.status !== BOOKING_STATUS.COMPLETED) {
      return { canReview: false, reason: 'Booking not completed' };
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return { canReview: false, reason: 'Already reviewed', hasReview: true, review: existingReview };
    }

    return { canReview: true };
  }
}

export default new ReviewService();
