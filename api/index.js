import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'healthbridge-secret-key-2024';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let path = req.url || '';
  
  // Handle Vercel route prefix - strip /api if present
  if (path.startsWith('/api')) {
    path = path.replace(/^\/api/, '');
  }
  
  console.log('Request path:', path, 'method:', method);
  
  const method = req.method;

  // Health check
  if (path === '/health' || path === '/health/') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  }

  // Root endpoint
  if (path === '/' || path === '') {
    return res.status(200).json({
      message: 'HealthBridge API',
      version: '2.0'
    });
  }

  // Login endpoint
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = req.body;
    
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

  // Register endpoint
  if (path === '/auth/register' && method === 'POST') {
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
  if (path === '/auth/google' && method === 'POST') {
    const { idToken, role } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token required'
      });
    }
    
    try {
      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid token format'
        });
      }
      
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token format'
        });
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      const picture = payload.picture;
      
      const token = jwt.sign(
        { email, role: role || 'customer', name, isGoogle: true, picture },
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
            role: role || 'customer',
            avatar: picture
          }
        }
      });
    } catch (e) {
      console.error('Google token error:', e);
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token: ' + e.message
      });
    }
  }

  // Verify OTP endpoint
  if (path === '/auth/verify-otp' && method === 'POST') {
    const { userId, otp } = req.body;
    
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      });
    }
    
    const token = jwt.sign(
      { userId, verified: true, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          userId,
          role: 'customer',
          isVerified: true
        }
      }
    });
  }

  // Resend OTP endpoint
  if (path === '/auth/resend-otp' && method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  }

  // Forgot Password endpoint
  if (path === '/auth/forgot-password' && method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'If the email exists, an OTP will be sent'
    });
  }

  // Get current user endpoint
  if (path === '/auth/me' && method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      return res.status(200).json({
        success: true,
        data: {
          user: {
            name: decoded.name || 'User',
            email: decoded.email,
            role: decoded.role || 'customer',
            avatar: decoded.picture
          }
        }
      });
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  // Logout endpoint
  if (path === '/auth/logout' && method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  // Services endpoint
  if (path.startsWith('/services')) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  res.status(404).json({ success: false, error: 'Not found', path });
}
