import reviewService from './review.service.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';

const createReview = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const review = await reviewService.createReview(
    bookingId,
    req.user._id,
    req.body
  );
  return ApiResponse.success(res, { review }, 'Review submitted successfully', 201);
});

const getBookingReview = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const review = await reviewService.getBookingReview(
    bookingId,
    req.user._id
  );
  return ApiResponse.success(res, { review });
});

const getProviderReviews = asyncHandler(async (req, res) => {
  const { providerProfileId } = req.params;
  const result = await reviewService.getProviderReviews(
    providerProfileId,
    req.query
  );
  return ApiResponse.success(res, result);
});

const getCustomerReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getCustomerReviews(
    req.user._id,
    req.query
  );
  return ApiResponse.paginated(res, result.reviews, result.pagination);
});

const addProviderReply = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { text } = req.body;
  
  const review = await reviewService.addProviderReply(
    reviewId,
    req.user._id,
    text
  );
  return ApiResponse.success(res, { review }, 'Reply added successfully');
});

const checkCanReview = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const result = await reviewService.checkCanReview(
    bookingId,
    req.user._id
  );
  return ApiResponse.success(res, result);
});

export default {
  createReview,
  getBookingReview,
  getProviderReviews,
  getCustomerReviews,
  addProviderReply,
  checkCanReview,
};
