import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import Booking from '../../models/Booking.model.js';
import User from '../../models/User.model.js';
import ProviderProfile from '../../models/ProviderProfile.model.js';
import { BOOKING_STATUS } from '../../config/constants.js';
import logger from '../utils/logger.js';

class ExportService {
  async exportBookingsPDF(filters = {}) {
    const bookings = await this._getBookingsForExport(filters);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 30,
          layout: 'landscape',
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc
          .fontSize(18)
          .fillColor('#0d9488')
          .text('HealthBridge - Bookings Report', { align: 'center' })
          .moveDown(0.5);

        // Date range
        const now = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc
          .fontSize(10)
          .fillColor('#64748b')
          .text(`Generated on: ${now}`, { align: 'center' })
          .moveDown(1);

        // Summary
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount?.finalAmount || 0), 0);
        const completedBookings = bookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length;
        
        doc
          .fontSize(10)
          .fillColor('#1e293b')
          .text(`Total Bookings: ${bookings.length}`, 30)
          .text(`Completed: ${completedBookings}`, 200)
          .text(`Total Revenue: ₹${totalRevenue.toLocaleString('en-IN')}`, 400)
          .moveDown(1);

        // Table Header
        const tableTop = doc.y;
        const headers = ['ID', 'Customer', 'Service', 'Provider', 'Date', 'Status', 'Amount'];
        const colWidths = [60, 100, 120, 100, 80, 70, 60];
        
        doc
          .fontSize(8)
          .fillColor('#ffffff')
          .rect(30, tableTop, 740, 18)
          .fill('#0d9488');

        let x = 30;
        headers.forEach((header, i) => {
          doc.text(header, x + 3, tableTop + 5, { width: colWidths[i] - 6 });
          x += colWidths[i];
        });

        // Table Rows
        let rowY = tableTop + 20;
        bookings.slice(0, 30).forEach((booking, index) => {
          if (rowY > 550) {
            doc.addPage();
            rowY = 30;
          }

          const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
          doc
            .fillColor(bgColor)
            .rect(30, rowY, 740, 16)
            .fill()
            .fontSize(7)
            .fillColor('#1e293b');

          x = 30;
          const rowData = [
            booking._id.slice(-8).toUpperCase(),
            booking.customer?.name?.substring(0, 15) || 'N/A',
            booking.service?.name?.substring(0, 20) || 'N/A',
            booking.provider?.name?.substring(0, 15) || 'Not Assigned',
            new Date(booking.scheduledDate).toLocaleDateString('en-IN'),
            booking.status,
            `₹${booking.amount?.finalAmount || 0}`,
          ];

          rowData.forEach((data, i) => {
            doc.text(data, x + 3, rowY + 4, { width: colWidths[i] - 6 });
            x += colWidths[i];
          });

          rowY += 16;
        });

        if (bookings.length > 30) {
          doc
            .moveDown(1)
            .fontSize(9)
            .fillColor('#64748b')
            .text(`Showing 30 of ${bookings.length} bookings. Export to Excel for complete data.`, { align: 'center' });
        }

        doc.end();
      } catch (error) {
        logger.error('Error generating PDF export:', error);
        reject(error);
      }
    });
  }

  async exportBookingsExcel(filters = {}) {
    const bookings = await this._getBookingsForExport(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HealthBridge';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Bookings', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: 'Booking ID', key: 'id', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Email', key: 'customerEmail', width: 25 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Service', key: 'service', width: 25 },
      { header: 'Provider', key: 'provider', width: 20 },
      { header: 'Scheduled Date', key: 'date', width: 15 },
      { header: 'Scheduled Time', key: 'time', width: 12 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Base Price', key: 'basePrice', width: 12 },
      { header: 'Discount', key: 'discount', width: 10 },
      { header: 'Final Amount', key: 'finalAmount', width: 12 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Created At', key: 'createdAt', width: 18 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    bookings.forEach((booking) => {
      worksheet.addRow({
        id: booking._id.toString(),
        customerName: booking.customer?.name || 'N/A',
        customerEmail: booking.customer?.email || 'N/A',
        customerPhone: booking.customer?.phone || 'N/A',
        service: booking.service?.name || 'N/A',
        provider: booking.provider?.name || 'Not Assigned',
        date: new Date(booking.scheduledDate).toLocaleDateString('en-IN'),
        time: booking.scheduledTime,
        status: booking.status,
        basePrice: booking.amount?.basePrice || 0,
        discount: booking.amount?.discount || 0,
        finalAmount: booking.amount?.finalAmount || 0,
        paymentStatus: booking.paymentStatus,
        address: booking.address
          ? `${booking.address.addressLine1 || ''}, ${booking.address.city || ''}, ${booking.address.state || ''}`
          : 'N/A',
        createdAt: new Date(booking.createdAt).toLocaleString('en-IN'),
      });
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
        });
      }
    });

    const statusColumn = worksheet.getColumn('status');
    statusColumn.eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        const status = cell.value;
        if (status === BOOKING_STATUS.COMPLETED) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { color: { argb: 'FF166534' } };
        } else if (status === BOOKING_STATUS.CANCELLED) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { color: { argb: 'FF991B1B' } };
        } else if (status === BOOKING_STATUS.PENDING) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
          cell.font = { color: { argb: 'FF854D0E' } };
        }
      }
    });

    return workbook.xlsx.writeBuffer();
  }

  async exportUsersExcel(filters = {}) {
    const query = { isDeleted: false };
    if (filters.role) query.role = filters.role;
    if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;

    const users = await User.find(query)
      .select('-password -otp -resetPasswordToken')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HealthBridge';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Users', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: 'User ID', key: 'id', width: 25 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Verified', key: 'isVerified', width: 10 },
      { header: 'Blocked', key: 'isBlocked', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 18 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };

    users.forEach((user) => {
      worksheet.addRow({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified ? 'Yes' : 'No',
        isBlocked: user.isBlocked ? 'Yes' : 'No',
        createdAt: new Date(user.createdAt).toLocaleString('en-IN'),
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async exportProvidersExcel(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;

    const providers = await ProviderProfile.find(query)
      .populate('user', 'name email phone isBlocked')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Providers');

    worksheet.columns = [
      { header: 'Provider ID', key: 'id', width: 25 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Specialization', key: 'specialization', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Total Jobs', key: 'totalJobs', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 18 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' },
    };

    providers.forEach((provider) => {
      worksheet.addRow({
        id: provider._id.toString(),
        name: provider.user?.name || 'N/A',
        email: provider.user?.email || 'N/A',
        phone: provider.user?.phone || 'N/A',
        specialization: provider.specialization,
        status: provider.status,
        rating: provider.rating?.average || 0,
        totalJobs: provider.stats?.totalJobs || 0,
        createdAt: new Date(provider.createdAt).toLocaleString('en-IN'),
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async _getBookingsForExport(filters = {}) {
    const query = { isDeleted: false };

    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.scheduledDate = {};
      if (filters.startDate) query.scheduledDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.scheduledDate.$lte = new Date(filters.endDate);
    }
    if (filters.serviceId) query.service = filters.serviceId;
    if (filters.providerId) query.provider = filters.providerId;

    return await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'name duration')
      .populate('address')
      .sort({ scheduledDate: -1, scheduledTime: -1 });
  }
}

export default new ExportService();
