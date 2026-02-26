import adminService from './admin.service.js';
import exportService from '../../shared/utils/export.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';

const getDashboardStats = asyncHandler(async (req, res) => {
  const result = await adminService.getDashboardStats();
  return ApiResponse.success(res, result);
});

const getAllUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getAllUsers(req.query);
  return ApiResponse.paginated(res, result.users, result.pagination);
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.userId);
  return ApiResponse.success(res, { user });
});

const blockUser = asyncHandler(async (req, res) => {
  const { isBlocked, reason } = req.body;
  
  let user;
  if (isBlocked) {
    user = await adminService.blockUser(req.params.userId, req.user._id, reason);
    return ApiResponse.success(res, { user }, 'User blocked successfully');
  } else {
    user = await adminService.unblockUser(req.params.userId, req.user._id);
    return ApiResponse.success(res, { user }, 'User unblocked successfully');
  }
});

const exportBookings = asyncHandler(async (req, res) => {
  const format = req.query.format || 'json';
  const filters = {
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    serviceId: req.query.serviceId,
    providerId: req.query.providerId,
  };

  if (format === 'pdf') {
    const pdfBuffer = await exportService.exportBookingsPDF(filters);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-report-${Date.now()}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  }

  if (format === 'excel' || format === 'xlsx') {
    const excelBuffer = await exportService.exportBookingsExcel(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-${Date.now()}.xlsx`);
    return res.end(excelBuffer);
  }

  if (format === 'csv') {
    const result = await adminService.exportBookings({ ...filters, format: 'csv' });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');

    const headers = ['ID', 'Customer', 'Email', 'Phone', 'Service', 'Provider', 'Status', 'Amount', 'Date', 'Time', 'Address'];
    res.write(headers.join(',') + '\n');

    for (const booking of result.bookings) {
      const row = [
        booking._id,
        escapeCsv(booking.customer?.name || ''),
        escapeCsv(booking.customer?.email || ''),
        escapeCsv(booking.customer?.phone || ''),
        escapeCsv(booking.service?.name || ''),
        escapeCsv(booking.provider?.name || 'Not assigned'),
        booking.status,
        booking.amount?.finalAmount || 0,
        booking.scheduledDate ? new Date(booking.scheduledDate).toISOString().split('T')[0] : '',
        booking.scheduledTime || '',
        escapeCsv(booking.address ? `${booking.address.addressLine1}, ${booking.address.city}` : ''),
      ];
      res.write(row.join(',') + '\n');
    }
    return res.end();
  }

  const result = await adminService.exportBookings(filters);
  return ApiResponse.success(res, { bookings: result.bookings });
});

const exportUsers = asyncHandler(async (req, res) => {
  const format = req.query.format || 'xlsx';
  const filters = {
    role: req.query.role,
    isBlocked: req.query.isBlocked,
  };

  const buffer = await exportService.exportUsersExcel(filters);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.xlsx`);
  return res.end(buffer);
});

const exportProviders = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
  };

  const buffer = await exportService.exportProvidersExcel(filters);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=providers-${Date.now()}.xlsx`);
  return res.end(buffer);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getAnalytics();
  return ApiResponse.success(res, { analytics });
});

function escapeCsv(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default {
  getDashboardStats,
  getAllUsers,
  getUserById,
  blockUser,
  exportBookings,
  exportUsers,
  exportProviders,
  getAnalytics,
};
