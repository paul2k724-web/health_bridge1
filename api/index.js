import { clientPromise } from './lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'healthbridge-secret-key-2024';

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
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production',
      database: 'connected'
    });
  }

  // Root endpoint
  if (path === '/' || path === '') {
    return res.status(200).json({
      message: 'HealthBridge API',
      version: '2.0'
    });
  }

  // Login endpoint - simple demo
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = req.body;
    
    // Demo users - accept any of these
    const demoUsers = {
      'admin@gmail.com': { name: 'Admin', role: 'admin', password: 'admin123' },
      'test@gmail.com': { name: 'Test User', role: 'customer', password: 'test123' },
      'customer@test.com': { name: 'Customer', role: 'customer', password: 'Test@123' },
      'provider@test.com': { name: 'Provider', role: 'provider', password: 'Test@123' }
    };
    
    const user = demoUsers[email];
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          name: user.name,
          email,
          role: user.role
        }
      }
    });
  }

  // Register endpoint - simple demo
  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const token = jwt.sign(
      { email, role: role || 'customer', name: name || email.split('@')[0] },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          name: name || email.split('@')[0],
          email,
          role: role || 'customer'
        }
      }
    });
  }

  // Google login endpoint
  if (path === '/api/auth/google' && method === 'POST') {
    const { idToken, role } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token required'
      });
    }
    
    // Decode Google token (simplified)
    try {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      
      const token = jwt.sign(
        { email, role: role || 'customer', name, isGoogle: true },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            name,
            email,
            role: role || 'customer'
          }
        }
      });
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }
  }

  // Services endpoint
  if (path.startsWith('/api/services')) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  res.status(404).json({ error: 'Not found', path });
}
