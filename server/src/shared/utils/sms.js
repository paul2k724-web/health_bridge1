import twilio from 'twilio';
import config from '../../config/index.js';
import logger from './logger.js';

let client = null;

const initializeClient = () => {
  if (!config.twilio.enabled) {
    logger.info('SMS is disabled');
    return null;
  }

  if (client) return client;

  client = twilio(config.twilio.accountSid, config.twilio.authToken);
  return client;
};

const sendSMS = async ({ to, body }) => {
  try {
    const twilioClient = initializeClient();
    
    if (!twilioClient) {
      logger.info('SMS skipped (disabled)', { to, body });
      return { success: true, messageId: null, skipped: true };
    }

    const message = await twilioClient.messages.create({
      body,
      from: config.twilio.phoneNumber,
      to,
    });

    logger.info('SMS sent successfully', {
      messageId: message.sid,
      to,
      status: message.status,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error('Failed to send SMS', {
      error: error.message,
      to,
    });
    
    return { success: false, error: error.message };
  }
};

const sendOTPSMS = async (phone, otp) => {
  const body = `Your HealthBridge verification code is: ${otp}. Valid for ${config.otp.expiryMinutes} minutes. Do not share this code.`;
  
  return sendSMS({ to: phone, body });
};

const sendBookingStatusSMS = async (phone, bookingId, status) => {
  const body = `HealthBridge: Your booking #${bookingId.slice(-8)} status has been updated to: ${status}. Check your app for details.`;
  
  return sendSMS({ to: phone, body });
};

const sendBookingNotificationSMS = async (phone, bookingData) => {
  const { service, customerName, scheduledDate, scheduledTime, distance } = bookingData;
  const body = `HealthBridge: New ${service} booking from ${customerName} on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}. Distance: ${distance}km. Open app to accept.`;
  
  return sendSMS({ to: phone, body });
};

export {
  sendSMS,
  sendOTPSMS,
  sendBookingStatusSMS,
  sendBookingNotificationSMS,
};

export default {
  sendSMS,
  sendOTPSMS,
  sendBookingStatusSMS,
  sendBookingNotificationSMS,
};
