import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'healthbridge-secret-key-2024';

// Demo users database
const users = {
  'admin@gmail.com': { name: 'Admin', role: 'admin', password: 'admin123' },
  'test@gmail.com': { name: 'Test User', role: 'customer', password: 'test123' }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = (req.url || '').split('?')[0];
  const method = req.method;
  const body = req.body || {};

  console.log('API called:', method, path);

  // Health check - TEST VERSION X
  if (path === '/api/health' || path === '/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'VERCEL_API_V1'
    });
  }

  // Login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const user = users[email];
    
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
      data: { token, user: { name: user.name, email, role: user.role } }
    });
  }

  // Register
  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, password, role } = body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const token = jwt.sign(
      { email, role: role || 'customer', name: name || email.split('@')[0] },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      data: { token, user: { name: name || email.split('@')[0], email, role: role || 'customer' } }
    });
  }

  // Google Login
  if (path === '/api/auth/google' && method === 'POST') {
    const { idToken, role } = body;
    
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google token required' });
    }
    
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        return res.status(400).json({ success: false, message: 'Invalid Google token' });
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
        data: { token, user: { name, email, role: role || 'customer', avatar: picture } }
      });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }
  }

  // Verify OTP
  if (path === '/api/auth/verify-otp' && method === 'POST') {
    const { userId, otp } = body;
    
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    const token = jwt.sign({ userId, verified: true, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ success: true, data: { token, user: { userId, role: 'customer', isVerified: true } } });
  }

  // Resend OTP
  if (path === '/api/auth/resend-otp' && method === 'POST') {
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  }

  // Forgot Password
  if (path === '/api/auth/forgot-password' && method === 'POST') {
    return res.status(200).json({ success: true, message: 'If email exists, OTP will be sent' });
  }

  // Logout
  if (path === '/api/auth/logout' && method === 'POST') {
    return res.status(200).json({ success: true, message: 'Logged out' });
  }

  // Services
  if (path.includes('/services')) {
    return res.status(200).json({ success: true, data: [] });
  }

  return res.status(404).json({ success: false, error: 'Not found', path });
}
