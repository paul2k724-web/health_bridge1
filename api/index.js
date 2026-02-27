  // Verify OTP endpoint
  if (path === '/api/auth/verify-otp' && method === 'POST') {
    const { userId, otp } = req.body;
    
    // For demo purposes, accept any 6-digit OTP
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      });
    }
    
    // Generate token for verified user
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
  if (path === '/api/auth/resend-otp' && method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  }

  // Forgot Password endpoint
  if (path === '/api/auth/forgot-password' && method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'If the email exists, an OTP will be sent'
    });
  }

  // Get current user endpoint
  if (path === '/api/auth/me' && method === 'GET') {
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
  if (path === '/api/auth/logout' && method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }