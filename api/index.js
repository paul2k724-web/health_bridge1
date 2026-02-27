export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url || '';

  if (path === '/api/health' || path === '/api/health/') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  }

  if (path === '/' || path === '') {
    return res.status(200).json({
      message: 'HealthBridge API',
      version: '2.0'
    });
  }

  // For demo purposes, return mock responses
  if (path.startsWith('/api/services')) {
    return res.status(200).json({
      success: true,
      data: { services: [], message: 'Demo mode - backend not connected' }
    });
  }

  if (path.startsWith('/api/auth/login')) {
    return res.status(200).json({
      success: true,
      message: 'Demo mode - backend not connected'
    });
  }

  res.status(404).json({ error: 'Not found', path });
}
