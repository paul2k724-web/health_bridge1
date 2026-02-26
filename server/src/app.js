import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import { errorHandler, notFound } from './shared/middleware/error.middleware.js';
import logger from './shared/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import serviceRoutes from './modules/services/service.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import providerRoutes from './modules/providers/provider.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(compression({
  level: 6,
  threshold: 100 * 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

app.use(
  cors({
    origin: config.client.url,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(xss());

if (config.server.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next();
  });
}

app.get('/api/health', async (req, res) => {
  const { healthCheck } = await import('./config/database.js');
  const dbHealth = await healthCheck();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    database: dbHealth ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/customer', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static files in production (must be before root route)
if (config.server.nodeEnv === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  console.log('Serving static files from:', clientPath);
  app.use(express.static(clientPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.get('/', (req, res) => {
  res.json({
    message: 'HealthBridge API',
    version: '2.1.0',
    documentation: '/api/health',
    features: [
      'Provider Onboarding',
      'Auto Assignment',
      'Real-time Tracking',
      'Rating System',
    ],
  });
});

app.use(notFound);

app.use(errorHandler);

export default app;
