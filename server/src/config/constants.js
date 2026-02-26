// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  PROVIDER_ARRIVING: 'provider_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
};

// Status Transitions (State Machine)
export const STATUS_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED],
  [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.PROVIDER_ARRIVING, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW],
  [BOOKING_STATUS.PROVIDER_ARRIVING]: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED],
  [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.REFUNDED],
  [BOOKING_STATUS.CANCELLED]: [BOOKING_STATUS.REFUNDED],
  [BOOKING_STATUS.NO_SHOW]: [],
  [BOOKING_STATUS.REJECTED]: [],
  [BOOKING_STATUS.REFUNDED]: [],
};

// Provider Status
export const PROVIDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Payment Status (Future-ready)
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  NOT_APPLICABLE: 'na',
};

// Address Labels
export const ADDRESS_LABELS = {
  HOME: 'Home',
  WORK: 'Work',
  OTHER: 'Other',
};

// File Upload
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Response Messages
export const MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Registration successful. Please verify your OTP.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  OTP_SENT: 'OTP sent successfully.',
  OTP_VERIFIED: 'OTP verified successfully.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  OTP_INVALID: 'Invalid OTP.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account is locked. Please try again later.',
  ACCOUNT_BLOCKED: 'Your account has been blocked. Please contact support.',
  TOKEN_EXPIRED: 'Token has expired.',
  TOKEN_INVALID: 'Invalid token.',
  
  // Booking
  BOOKING_CREATED: 'Booking created successfully.',
  BOOKING_CONFIRMED: 'Booking confirmed successfully.',
  BOOKING_ASSIGNED: 'Provider assigned successfully.',
  BOOKING_ACCEPTED: 'Booking accepted successfully.',
  BOOKING_CANCELLED: 'Booking cancelled successfully.',
  BOOKING_COMPLETED: 'Booking completed successfully.',
  BOOKING_RESCHEDULED: 'Booking rescheduled successfully.',
  BOOKING_NOT_FOUND: 'Booking not found.',
  DOUBLE_BOOKING: 'You already have a booking for this time slot.',
  INVALID_STATUS_TRANSITION: 'Invalid status transition.',
  CANCELLATION_TOO_LATE: 'Cancellation within 24 hours may incur charges.',
  RESCHEDULE_LIMIT_EXCEEDED: 'Maximum reschedule attempts exceeded.',
  PROVIDER_NOT_AVAILABLE: 'Selected provider is not available for this slot.',
  
  // Refund
  REFUND_PROCESSED: 'Refund processed successfully.',
  REFUND_PENDING: 'Refund is being processed.',
  
  // Provider
  PROVIDER_REGISTERED: 'Provider registration submitted. Awaiting approval.',
  PROVIDER_APPROVED: 'Provider approved successfully.',
  PROVIDER_REJECTED: 'Provider rejected.',
  PROVIDER_NOT_FOUND: 'Provider not found.',
  PROVIDER_NOT_APPROVED: 'Provider account is not yet approved.',
  
  // General
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'Unauthorized access.',
  FORBIDDEN: 'Access forbidden.',
  VALIDATION_ERROR: 'Validation error.',
  SERVER_ERROR: 'Internal server error.',
};

export default {
  USER_ROLES,
  BOOKING_STATUS,
  STATUS_TRANSITIONS,
  PROVIDER_STATUS,
  PAYMENT_STATUS,
  ADDRESS_LABELS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  PAGINATION,
  MESSAGES,
};
