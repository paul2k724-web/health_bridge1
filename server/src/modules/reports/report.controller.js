import reportService from './report.service.js';
import ApiResponse from '../../shared/utils/response.js';
import asyncHandler from '../../shared/middleware/async.middleware.js';
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded', 400);
  }

  const result = await reportService.uploadReport(
    req.user._id,
    req.body.bookingId,
    req.file
  );

  return ApiResponse.created(res, result, 'Report uploaded successfully');
});

const getReportDownloadUrl = asyncHandler(async (req, res) => {
  const result = await reportService.getReportDownloadUrl(
    req.user._id,
    req.params.bookingId,
    req.params.reportIndex
  );

  return ApiResponse.success(res, result);
});

const deleteReport = asyncHandler(async (req, res) => {
  const result = await reportService.deleteReport(
    req.user._id,
    req.params.bookingId,
    req.params.reportIndex
  );

  return ApiResponse.success(res, null, result.message);
});

export default {
  uploadReport,
  getReportDownloadUrl,
  deleteReport,
  upload,
};
