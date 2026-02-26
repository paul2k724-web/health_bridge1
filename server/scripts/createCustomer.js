import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.model.js';
import Address from '../src/models/Address.model.js';

dotenv.config();

const DEFAULT_CUSTOMER = {
  name: 'Test Customer',
  email: 'customer@test.com',
  phone: '7777777777',
  password: 'customer123',
  role: 'customer',
};

const createCustomer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    const existingUser = await User.findOne({ email: DEFAULT_CUSTOMER.email.toLowerCase() });

    if (existingUser) {
      console.log(`\n⚠️  Customer with email "${DEFAULT_CUSTOMER.email}" already exists.`);
      console.log('\n📋 Customer Details:');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Phone: ${existingUser.phone}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Verified: ${existingUser.isVerified}`);

      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
      process.exit(0);
    }

    const existingPhone = await User.findOne({ phone: DEFAULT_CUSTOMER.phone });
    if (existingPhone) {
      console.error(`\n❌ Error: Phone number "${DEFAULT_CUSTOMER.phone}" is already registered`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('\n📦 Creating customer user...');

    const customer = await User.create({
      name: DEFAULT_CUSTOMER.name,
      email: DEFAULT_CUSTOMER.email.toLowerCase(),
      phone: DEFAULT_CUSTOMER.phone,
      password: DEFAULT_CUSTOMER.password,
      role: 'customer',
      isVerified: true,
      isBlocked: false,
    });

    console.log(`   ✅ User created: ${customer.email}`);

    const address = await Address.create({
      user: customer._id,
      label: 'Home',
      addressLine1: '123 Main Street',
      addressLine2: 'Near Central Park',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      landmark: 'Central Park',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
      },
      isDefault: true,
    });

    customer.addresses.push(address._id);
    customer.defaultAddress = address._id;
    await customer.save();

    console.log(`   ✅ Address created: ${address.addressLine1}, ${address.city}`);

    console.log('\n✅ Customer created successfully!');
    console.log('📋 Customer Details:');
    console.log(`   Name: ${customer.name}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Phone: ${customer.phone}`);
    console.log(`   Password: ${DEFAULT_CUSTOMER.password}`);
    console.log(`   Role: ${customer.role}`);
    console.log(`   Address: ${address.addressLine1}, ${address.city}`);
    console.log(`   ID: ${customer._id}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('✨ Process completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating customer:');
    console.error(error.message);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createCustomer();
