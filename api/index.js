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

  // Seed admin user
  if (path === '/api/seed' && method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db();
      
      const adminExists = await db.collection('users').findOne({ email: 'admin@gmail.com' });
      if (!adminExists) {
        await db.collection('users').insertOne({
          name: 'Admin',
          email: 'admin@gmail.com',
          password: 'admin123',
          phone: '+919999999999',
          role: 'admin',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const customerExists = await db.collection('users').findOne({ email: 'customer@test.com' });
      if (!customerExists) {
        await db.collection('users').insertOne({
          name: 'Test Customer',
          email: 'customer@test.com',
          password: 'Test@123',
          phone: '+919999999998',
          role: 'customer',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const providerExists = await db.collection('users').findOne({ email: 'provider@test.com' });
      if (!providerExists) {
        await db.collection('users').insertOne({
          name: 'Test Provider',
          email: 'provider@test.com',
          password: 'Test@123',
          phone: '+919999999997',
          role: 'provider',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Users seeded successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Seed failed'
      });
    }
  }

  // Login endpoint
  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = req.body;
      const client = await clientPromise;
      const db = client.db();
      
      const user = await db.collection('users').findOne({ email });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  // Register endpoint
  if (path === '/api/auth/register' && method === 'POST') {
    try {
      const { name, email, password, phone, role } = req.body;
      const client = await clientPromise;
      const db = client.db();
      
      const existing = await db.collection('users').findOne({ email });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      const result = await db.collection('users').insertOne({
        name,
        email,
        password,
        phone,
        role: role || 'customer',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const token = jwt.sign(
        { userId: result.insertedId, email, role: role || 'customer' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            _id: result.insertedId,
            name,
            email,
            role: role || 'customer'
          }
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  // Services endpoint
  if (path.startsWith('/api/services')) {
    try {
      const client = await clientPromise;
      const db = client.db();
      const services = await db.collection('servicecategories').find({}).toArray();
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
