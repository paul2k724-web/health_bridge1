import { Router } from 'express';
import reportController from './report.controller.js';
import { protect } from '../../shared/middleware/auth.middleware.js';
import { requireProvider } from '../../shared/middleware/role.middleware.js';
import { uploadLimiter } from '../../shared/middleware/rate-limit.middleware.js';

const router = Router();

router.post(
  '/upload',
  protect,
  requireProvider,
  uploadLimiter,
  reportController.upload.single('report'),
  reportController.uploadReport
);

router.get(
  '/download/:bookingId/:reportIndex',
  protect,
  reportController.getReportDownloadUrl
);

router.delete(
  '/:bookingId/:reportIndex',
  protect,
  requireProvider,
  reportController.deleteReport
);

export default router;
