import { Router } from 'express';
import notificationController from './notification.controller.js';
import { validateParams } from '../../shared/middleware/validate.middleware.js';
import { notificationIdSchema } from './notification.validator.js';
import { protect } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:notificationId/read', validateParams(notificationIdSchema), notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', validateParams(notificationIdSchema), notificationController.deleteNotification);
router.delete('/', notificationController.clearAll);

export default router;
