import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

global.testUtils = {
  createTestUser: async (userData = {}) => {
    const User = (await import('../src/models/User.model.js')).default;
    const bcrypt = await import('bcryptjs');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    return await User.create({
      name: 'Test User',
      email: `test${Date.now()}@test.com`,
      phone: `9999999${Math.floor(Math.random() * 1000)}`,
      password: hashedPassword,
      role: 'customer',
      isVerified: true,
      ...userData,
    });
  },
  
  createTestService: async (serviceData = {}) => {
    const ServiceCategory = (await import('../src/models/ServiceCategory.model.js')).default;
    
    return await ServiceCategory.create({
      name: `Test Service ${Date.now()}`,
      description: 'Test service description',
      basePrice: 500,
      duration: 30,
      isActive: true,
      ...serviceData,
    });
  },
  
  createTestAddress: async (userId, addressData = {}) => {
    const Address = (await import('../src/models/Address.model.js')).default;
    
    return await Address.create({
      user: userId,
      label: 'Home',
      addressLine1: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
      },
      ...addressData,
    });
  },
  
  generateToken: async (userId) => {
    const jwt = await import('jsonwebtoken');
    const config = (await import('../src/config/index.js')).default;
    
    return jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: '15m' });
  },
};
