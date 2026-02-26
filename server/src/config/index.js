import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 50,
      minPoolSize: 5,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    },
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    enabled: process.env.ENABLE_SMS === 'true',
  },
  
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  
  features: {
    logOtpToConsole: process.env.LOG_OTP_TO_CONSOLE === 'true',
    enableSms: process.env.ENABLE_SMS === 'true',
  },
  
  rateLimit: {
    auth: {
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 5,
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 60000,
    },
    api: {
      max: parseInt(process.env.RATE_LIMIT_API_MAX, 10) || 100,
      windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS, 10) || 900000,
    },
  },
  
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
    lockoutMinutes: parseInt(process.env.OTP_LOCKOUT_MINUTES, 10) || 30,
  },
  
  security: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    loginLockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_MINUTES, 10) || 30,
  },
  
  provider: {
    defaultSearchRadiusKm: parseInt(process.env.DEFAULT_SEARCH_RADIUS_KM, 10) || 10,
    maxSearchRadiusKm: parseInt(process.env.MAX_SEARCH_RADIUS_KM, 10) || 20,
  },
  
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  
  contact: {
    telegramUrl: process.env.TELEGRAM_CONTACT_URL || 'https://t.me/abrahampaulsanhith',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@healthbridge.com',
    supportPhone: process.env.SUPPORT_PHONE || '+91-XXXXXXXXXX',
  },
  
  invoice: {
    companyName: process.env.INVOICE_COMPANY_NAME || 'HealthBridge Healthcare Services',
    companyAddress: process.env.INVOICE_COMPANY_ADDRESS || 'New Delhi, India',
    companyGst: process.env.INVOICE_COMPANY_GST || '',
    prefix: process.env.INVOICE_PREFIX || 'HB',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
    ttl: {
      default: parseInt(process.env.REDIS_DEFAULT_TTL, 10) || 3600,
      services: parseInt(process.env.REDIS_SERVICES_TTL, 10) || 1800,
      stats: parseInt(process.env.REDIS_STATS_TTL, 10) || 300,
      session: parseInt(process.env.REDIS_SESSION_TTL, 10) || 86400,
    },
  },
};

export default config;
