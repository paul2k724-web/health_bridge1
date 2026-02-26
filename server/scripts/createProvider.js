import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.model.js';
import ProviderProfile from '../src/models/ProviderProfile.model.js';

dotenv.config();

const DEFAULT_PROVIDER = {
  name: 'Dr. Test Provider',
  email: 'provider@test.com',
  phone: '8888888888',
  password: 'provider123',
  role: 'provider',
  specialization: 'General Physician',
  experience: 5,
  licenseNumber: 'MED-2024-001',
  bio: 'Experienced general physician with expertise in family medicine and preventive care.',
};

const createProvider = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    const existingUser = await User.findOne({ email: DEFAULT_PROVIDER.email.toLowerCase() });

    if (existingUser) {
      console.log(`\n⚠️  Provider with email "${DEFAULT_PROVIDER.email}" already exists.`);
      
      let existingProfile = await ProviderProfile.findOne({ user: existingUser._id });
      
      if (!existingProfile) {
        console.log('   Creating missing provider profile...');
        existingProfile = await ProviderProfile.create({
          user: existingUser._id,
          specialization: DEFAULT_PROVIDER.specialization,
          experience: DEFAULT_PROVIDER.experience,
          licenseNumber: DEFAULT_PROVIDER.licenseNumber,
          bio: DEFAULT_PROVIDER.bio,
          status: 'approved',
          documentsVerified: true,
          isAvailable: true,
          currentLocation: {
            type: 'Point',
            coordinates: [77.2090, 28.6139],
          },
        });
        console.log('   ✅ Provider profile created');
      }
      
      console.log('\n📋 Provider Details:');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Phone: ${existingUser.phone}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Verified: ${existingUser.isVerified}`);
      
      if (existingProfile) {
        console.log(`   Specialization: ${existingProfile.specialization}`);
        console.log(`   Experience: ${existingProfile.experience} years`);
        console.log(`   License: ${existingProfile.licenseNumber}`);
        console.log(`   Status: ${existingProfile.status}`);
      }

      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
      process.exit(0);
    }

    const existingPhone = await User.findOne({ phone: DEFAULT_PROVIDER.phone });
    if (existingPhone) {
      console.error(`\n❌ Error: Phone number "${DEFAULT_PROVIDER.phone}" is already registered`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('\n📦 Creating provider user...');

    const provider = await User.create({
      name: DEFAULT_PROVIDER.name,
      email: DEFAULT_PROVIDER.email.toLowerCase(),
      phone: DEFAULT_PROVIDER.phone,
      password: DEFAULT_PROVIDER.password,
      role: 'provider',
      isVerified: true,
      isBlocked: false,
    });

    console.log(`   ✅ User created: ${provider.email}`);

    const providerProfile = await ProviderProfile.create({
      user: provider._id,
      specialization: DEFAULT_PROVIDER.specialization,
      experience: DEFAULT_PROVIDER.experience,
      licenseNumber: DEFAULT_PROVIDER.licenseNumber,
      bio: DEFAULT_PROVIDER.bio,
      status: 'approved',
      documentsVerified: true,
      isAvailable: true,
      currentLocation: {
        type: 'Point',
        coordinates: [77.2090, 28.6139],
      },
    });

    console.log(`   ✅ Provider profile created (approved)`);

    console.log('\n✅ Provider created successfully!');
    console.log('📋 Provider Details:');
    console.log(`   Name: ${provider.name}`);
    console.log(`   Email: ${provider.email}`);
    console.log(`   Phone: ${provider.phone}`);
    console.log(`   Password: ${DEFAULT_PROVIDER.password}`);
    console.log(`   Role: ${provider.role}`);
    console.log(`   Specialization: ${providerProfile.specialization}`);
    console.log(`   Experience: ${providerProfile.experience} years`);
    console.log(`   License: ${providerProfile.licenseNumber}`);
    console.log(`   Status: ${providerProfile.status}`);
    console.log(`   ID: ${provider._id}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('✨ Process completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating provider:');
    console.error(error.message);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createProvider();
