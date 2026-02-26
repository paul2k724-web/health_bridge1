import PDFDocument from 'pdfkit';
import config from '../../config/index.js';
import logger from './logger.js';

const generateInvoicePDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .fillColor('#0d9488')
        .text(config.invoice.companyName, { align: 'center' })
        .fontSize(10)
        .fillColor('#64748b')
        .text(config.invoice.companyAddress, { align: 'center' })
        .moveDown(0.5);

      // Invoice Title
      doc
        .fontSize(20)
        .fillColor('#1e293b')
        .text('INVOICE', { align: 'center' })
        .moveDown(1);

      // Horizontal line
      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()
        .moveDown(1);

      // Invoice Details
      const invoiceNumber = `${config.invoice.prefix}-${new Date().getFullYear()}-${booking._id.toString().slice(-8).toUpperCase()}`;
      const invoiceDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      doc
        .fontSize(10)
        .fillColor('#64748b')
        .text('Invoice Number:', 50, doc.y)
        .fillColor('#1e293b')
        .text(invoiceNumber, 150, doc.y - 12)
        .fillColor('#64748b')
        .text('Invoice Date:', 350, doc.y - 12)
        .fillColor('#1e293b')
        .text(invoiceDate, 430, doc.y - 12)
        .moveDown(1);

      // Bill To Section
      doc
        .fontSize(12)
        .fillColor('#0d9488')
        .text('Bill To:', { continued: true })
        .moveDown(0.3)
        .fontSize(10)
        .fillColor('#1e293b')
        .text(booking.customer?.name || 'Customer')
        .fillColor('#64748b')
        .text(booking.customer?.email || '')
        .text(booking.customer?.phone || '')
        .moveDown(1);

      // Service Details
      doc
        .fontSize(12)
        .fillColor('#0d9488')
        .text('Service Details:', { continued: true })
        .moveDown(0.3);

      // Service Table Header
      const tableTop = doc.y;
      const colWidths = [250, 80, 100, 80];
      const headers = ['Service', 'Duration', 'Date & Time', 'Amount'];

      doc
        .fontSize(9)
        .fillColor('#ffffff')
        .rect(50, tableTop, 495, 20)
        .fill('#0d9488');

      let x = 50;
      headers.forEach((header, i) => {
        doc
          .fillColor('#ffffff')
          .text(header, x + 5, tableTop + 5, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      // Service Table Row
      const rowTop = tableTop + 25;
      const serviceDate = new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      doc
        .fillColor('#f8fafc')
        .rect(50, rowTop, 495, 25)
        .fill()
        .fontSize(9)
        .fillColor('#1e293b');

      x = 50;
      const rowData = [
        booking.service?.name || 'Healthcare Service',
        `${booking.service?.duration || 30} mins`,
        `${serviceDate} ${booking.scheduledTime}`,
        `₹${booking.amount?.basePrice?.toLocaleString('en-IN')}`,
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x + 5, rowTop + 8, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      // Provider Info
      if (booking.provider) {
        doc
          .moveDown(2)
          .fontSize(10)
          .fillColor('#64748b')
          .text('Service Provider: ', { continued: true })
          .fillColor('#1e293b')
          .text(booking.provider.name || 'Healthcare Professional');
      }

      // Address
      if (booking.address) {
        doc
          .moveDown(0.5)
          .fontSize(10)
          .fillColor('#64748b')
          .text('Service Location: ', { continued: true })
          .fillColor('#1e293b')
          .text(
            `${booking.address.addressLine1 || ''}, ${booking.address.city || ''}, ${booking.address.state || ''} ${booking.address.pincode || ''}`
          );
      }

      // Summary Box
      doc.moveDown(1);
      const summaryTop = doc.y;

      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .rect(350, summaryTop, 195, 80)
        .stroke();

      doc
        .fontSize(10)
        .fillColor('#64748b')
        .text('Subtotal:', 360, summaryTop + 10)
        .fillColor('#1e293b')
        .text(`₹${booking.amount?.basePrice?.toLocaleString('en-IN')}`, 480, summaryTop + 10, { align: 'right', width: 50 });

      if (booking.amount?.discount > 0) {
        doc
          .fillColor('#22c55e')
          .text('Discount:', 360, summaryTop + 28)
          .text(`-₹${booking.amount.discount?.toLocaleString('en-IN')}`, 480, summaryTop + 28, { align: 'right', width: 50 });
      }

      doc
        .strokeColor('#e2e8f0')
        .moveTo(360, summaryTop + 50)
        .lineTo(535, summaryTop + 50)
        .stroke()
        .fontSize(12)
        .fillColor('#0d9488')
        .text('Total:', 360, summaryTop + 58)
        .text(`₹${booking.amount?.finalAmount?.toLocaleString('en-IN')}`, 430, summaryTop + 58, { align: 'right', width: 100 });

      // Payment Status
      doc
        .moveDown(4)
        .fontSize(10)
        .fillColor('#64748b')
        .text('Payment Status: ', { continued: true })
        .fillColor(booking.paymentStatus === 'paid' ? '#22c55e' : '#f59e0b')
        .text(booking.paymentStatus === 'paid' ? 'Paid' : 'To be collected');

      // Contact for Payment
      doc
        .moveDown(2)
        .fontSize(11)
        .fillColor('#0d9488')
        .text('For Payment & Queries:', { align: 'center' })
        .moveDown(0.3)
        .fontSize(10)
        .fillColor('#1e293b')
        .text(`Contact us on Telegram: ${config.contact.telegramUrl}`, { align: 'center' })
        .moveDown(0.3)
        .fillColor('#64748b')
        .text(`Email: ${config.contact.supportEmail}`, { align: 'center' });

      // Footer
      doc
        .moveDown(2)
        .fontSize(8)
        .fillColor('#94a3b8')
        .text('Thank you for choosing HealthBridge!', { align: 'center' })
        .text('This is a computer-generated invoice and does not require a signature.', { align: 'center' });

      doc.end();
    } catch (error) {
      logger.error('Error generating invoice PDF:', error);
      reject(error);
    }
  });
};

const generateInvoiceNumber = (bookingId) => {
  return `${config.invoice.prefix}-${new Date().getFullYear()}-${bookingId.toString().slice(-8).toUpperCase()}`;
};

export { generateInvoicePDF, generateInvoiceNumber };
export default { generateInvoicePDF, generateInvoiceNumber };
