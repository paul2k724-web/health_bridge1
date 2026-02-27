export default function handler(req, res) {
  if (req.url === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
    });
  }
  
  if (req.url === '/' || req.url === '') {
    return res.status(200).json({ 
      message: 'HealthBridge API', 
      version: '2.0' 
    });
  }
  
  return res.status(404).json({ error: 'Not found' });
}
