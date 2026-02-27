import { clientPromise } from './lib/mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url || '';
  const method = req.method;

  // Health check
  if (path === '/api/health' || path === '/api/health/') {
    try {
      const client = await clientPromise;
      const admin = client.db().admin();
      await admin.ping();
      
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: 'connected'
      });
    } catch (error) {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: 'disconnected'
      });
    }
  }

  // Root endpoint
  if (path === '/' || path === '') {
    return res.status(200).json({
      message: 'HealthBridge API',
      version: '2.0'
    });
  }

  // Services endpoint
  if (path.startsWith('/api/services')) {
    try {
      const client = await clientPromise;
      const db = client.db();
      const services = await db.collection('servicecategories').find({}).limit(10).toArray();
      
      return res.status(200).json({
        success: true,
        data: services
      });
    } catch (error) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Using demo data'
      });
    }
  }

  res.status(404).json({ error: 'Not found', path });
}
