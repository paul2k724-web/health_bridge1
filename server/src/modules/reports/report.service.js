import cloudinary from 'cloudinary';
import config from '../../config/index.js';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../../config/constants.js';
import Booking from '../../models/Booking.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors/index.js';

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

class ReportService {
  async uploadReport(providerId, bookingId, file) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.provider?.toString() !== providerId) {
      throw new ForbiddenError('You are not authorized to upload reports for this booking');
    }

    if (booking.status !== 'in_progress') {
      throw new ValidationError('Reports can only be uploaded for in-progress bookings');
    }

    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new ValidationError('Only PDF, JPG, JPEG, and PNG files are allowed');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File size must be less than 5MB');
    }

    const result = await cloudinary.v2.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: 'reports',
        resource_type: 'auto',
        type: 'authenticated',
      }
    );

    booking.reports.push({
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
      uploadedBy: providerId,
    });

    await booking.save();

    await AuditLog.create({
      action: 'REPORT_UPLOADED',
      actor: { userId: providerId, role: 'provider' },
      target: { type: 'Booking', id: bookingId },
      metadata: {
        reportId: result.public_id,
        fileName: file.originalname,
      },
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
    };
  }

  async getReportDownloadUrl(userId, bookingId, reportIndex) {
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'name')
      .populate('provider', 'name');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const isCustomer = booking.customer?._id?.toString() === userId;
    const isProvider = booking.provider?._id?.toString() === userId;

    if (!isCustomer && !isProvider) {
      throw new ForbiddenError('You are not authorized to access this report');
    }

    const report = booking.reports[reportIndex];
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    const signedUrl = cloudinary.v2.utils.private_download_url(
      report.publicId,
      this.getFileExtension(report.publicId),
      { expires_at: Math.floor(Date.now() / 1000) + 3600 }
    );

    return {
      downloadUrl: signedUrl,
      report: {
        url: report.url,
        uploadedAt: report.uploadedAt,
      },
    };
  }

  async deleteReport(providerId, bookingId, reportIndex) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.provider?.toString() !== providerId) {
      throw new ForbiddenError('You are not authorized to delete reports for this booking');
    }

    const report = booking.reports[reportIndex];
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.publicId) {
      await cloudinary.v2.uploader.destroy(report.publicId);
    }

    booking.reports.splice(reportIndex, 1);
    await booking.save();

    await AuditLog.create({
      action: 'REPORT_DELETED',
      actor: { userId: providerId, role: 'provider' },
      target: { type: 'Booking', id: bookingId },
      metadata: { reportId: report.publicId },
    });

    return { message: 'Report deleted successfully' };
  }

  getFileExtension(publicId) {
    const parts = publicId.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'pdf';
  }
}

export default new ReportService();
