import bookingService from './booking.service.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';
import { generateInvoicePDF, generateInvoiceNumber } from '../../shared/utils/invoice.js';
import Booking from '../../models/Booking.model.js';

const createBooking = asyncHandler(async (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  
  const result = await bookingService.createBooking(req.user._id, {
    ...req.body,
    idempotencyKey,
  });

  const statusCode = result.duplicate ? 200 : 201;
  const message = result.duplicate ? 'Booking already exists' : 'Booking created successfully';

  return ApiResponse.success(res, result, message, statusCode);
});

const getMyBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getCustomerBookings(req.user._id, req.query);
  return ApiResponse.paginated(res, result.bookings, result.pagination);
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  return ApiResponse.success(res, { booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  
  const booking = await bookingService.updateStatus(
    req.params.id,
    status,
    req.user._id,
    req.user.role,
    reason
  );
  
  return ApiResponse.success(res, { booking }, `Booking ${status}`);
});

const getAllBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.getAllBookings(req.query);
  return ApiResponse.paginated(res, result.bookings, result.pagination);
});

const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirmBooking(req.params.id, req.user._id);
  return ApiResponse.success(res, { booking }, 'Booking confirmed');
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await bookingService.getStats();
  return ApiResponse.success(res, { stats });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.params.id,
    req.user._id,
    req.body.reason
  );
  return ApiResponse.success(res, { booking }, 'Booking cancelled successfully');
});

const rescheduleBooking = asyncHandler(async (req, res) => {
  const { scheduledDate, scheduledTime, reason } = req.body;
  
  const booking = await bookingService.rescheduleBooking(
    req.params.id,
    req.user._id,
    scheduledDate,
    scheduledTime,
    reason
  );
  return ApiResponse.success(res, { booking }, 'Booking rescheduled successfully');
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('service', 'name description duration')
    .populate('provider', 'name phone')
    .populate('address');

  if (!booking) {
    return ApiResponse.error(res, 'Booking not found', 404);
  }

  if (
    booking.customer._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return ApiResponse.error(res, 'Access denied', 403);
  }

  const pdfBuffer = await generateInvoicePDF(booking);
  const invoiceNumber = generateInvoiceNumber(booking._id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice-${invoiceNumber}.pdf"`
  );
  res.setHeader('Content-Length', pdfBuffer.length);

  return res.end(pdfBuffer);
});

const getContactInfo = asyncHandler(async (req, res) => {
  const contactInfo = {
    telegramUrl: process.env.TELEGRAM_CONTACT_URL || 'https://t.me/abrahampaulsanhith',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@healthbridge.com',
    supportPhone: process.env.SUPPORT_PHONE || '',
  };
  return ApiResponse.success(res, { contactInfo });
});

export default {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  getAllBookings,
  confirmBooking,
  cancelBooking,
  rescheduleBooking,
  downloadInvoice,
  getContactInfo,
  getStats,
};
