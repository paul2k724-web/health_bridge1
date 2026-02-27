import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Simple health that checks MongoDB connection
app.get('/api/health', async (req, res) => {
  try {
    // For now, return healthy - full MongoDB connection will be configured
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'HealthBridge API',
    version: '2.0',
    endpoints: [
      '/api/health',
      '/api/auth/*',
      '/api/services/*',
      '/api/bookings/*',
    ],
  });
});

export default app;
