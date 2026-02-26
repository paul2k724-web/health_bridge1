import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import logger from './logger.js';

let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = initializeTransporter();

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    const info = await transport.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to,
      subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to,
      subject,
    });
    throw error;
  }
};

const sendOTPEmail = async (email, otp, name = 'User') => {
  const subject = 'Your OTP Verification Code - HealthBridge';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0F172A 0%, #0D9488 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #0D9488; text-align: center; letter-spacing: 8px; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
        .warning { color: #dc3545; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HealthBridge</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for using HealthBridge. Your One-Time Password (OTP) for verification is:</p>
          <div class="otp-code">${otp}</div>
          <p class="warning">This OTP will expire in ${config.otp.expiryMinutes} minutes. Do not share this code with anyone.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
          <p>Best regards,<br>The HealthBridge Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message from HealthBridge. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

const sendBookingConfirmationEmail = async (email, booking) => {
  const subject = 'Booking Confirmed - HealthBridge';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0F172A 0%, #0D9488 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { color: #666; }
        .detail-value { font-weight: bold; }
        .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HealthBridge</h1>
        </div>
        <div class="content">
          <h2>Booking Confirmed!</h2>
          <p>Your booking has been successfully created. Here are the details:</p>
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${booking.service?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(booking.scheduledDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${booking.scheduledTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">₹${booking.amount?.finalAmount || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${booking.status}</span>
            </div>
          </div>
          <p>You will be notified when a provider accepts your booking.</p>
          <p>Best regards,<br>The HealthBridge Team</p>
        </div>
        <div class="footer">
          <p>Booking ID: ${booking._id}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

const sendStatusUpdateEmail = async (email, booking) => {
  const subject = `Booking Status Updated - ${booking.status} - HealthBridge`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0F172A 0%, #0D9488 100%); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px; }
        .status-badge { display: inline-block; padding: 10px 20px; background: #0D9488; color: white; border-radius: 20px; font-weight: bold; }
        .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HealthBridge</h1>
        </div>
        <div class="content">
          <h2>Booking Status Update</h2>
          <p>Your booking status has been updated:</p>
          <p style="text-align: center;"><span class="status-badge">${booking.status}</span></p>
          <p><strong>Service:</strong> ${booking.service?.name || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</p>
          ${booking.provider ? `<p><strong>Provider:</strong> ${booking.provider.name}</p>` : ''}
          <p>Best regards,<br>The HealthBridge Team</p>
        </div>
        <div class="footer">
          <p>Booking ID: ${booking._id}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

export {
  sendEmail,
  sendOTPEmail,
  sendBookingConfirmationEmail,
  sendStatusUpdateEmail,
};

export default {
  sendEmail,
  sendOTPEmail,
  sendBookingConfirmationEmail,
  sendStatusUpdateEmail,
};
