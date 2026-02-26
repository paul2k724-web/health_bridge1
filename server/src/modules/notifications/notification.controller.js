import notificationService from './notification.service.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  return ApiResponse.paginated(res, result.notifications, {
    ...result.pagination,
    unreadCount: result.unreadCount,
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);
  return ApiResponse.success(res, result);
});

const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await notificationService.markAsRead(notificationId, req.user._id);
  return ApiResponse.success(res, { notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return ApiResponse.success(res, result, 'All notifications marked as read');
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  await notificationService.deleteNotification(notificationId, req.user._id);
  return ApiResponse.success(res, null, 'Notification deleted');
});

const clearAll = asyncHandler(async (req, res) => {
  const result = await notificationService.clearAll(req.user._id);
  return ApiResponse.success(res, result, 'All notifications cleared');
});

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
};
