import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending error:', error);
    throw error;
  }
};

export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your OTP for Healthcare Platform</h2>
      <p>Your OTP code is: <strong style="font-size: 24px; color: #4CAF50;">${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
  return await sendEmail(email, 'Your OTP Code', html);
};

export const sendBookingConfirmation = async (email, bookingDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmed!</h2>
      <p>Your booking has been confirmed successfully.</p>
      <h3>Booking Details:</h3>
      <ul>
        <li>Service: ${bookingDetails.serviceName}</li>
        <li>Date: ${new Date(bookingDetails.scheduledDate).toLocaleDateString()}</li>
        <li>Time: ${bookingDetails.scheduledTime}</li>
        <li>Amount: ₹${bookingDetails.amount}</li>
      </ul>
      <p>Thank you for using our platform!</p>
    </div>
  `;
  return await sendEmail(email, 'Booking Confirmed', html);
};

export const sendStatusUpdate = async (email, bookingId, status) => {
  const statusMessages = {
    accepted: 'Your booking has been accepted by the provider.',
    provider_arriving: 'The provider is on the way to your location.',
    in_progress: 'The service is currently in progress.',
    completed: 'Your service has been completed successfully.'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Status Update</h2>
      <p>${statusMessages[status] || 'Your booking status has been updated.'}</p>
      <p>Booking ID: ${bookingId}</p>
      <p>New Status: <strong>${status.replace('_', ' ').toUpperCase()}</strong></p>
    </div>
  `;
  return await sendEmail(email, 'Booking Status Update', html);
};
