import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../src/models/User.model.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default admin details
const DEFAULT_ADMIN = {
  name: 'Super-Admin',
  email: 'admin@gmail.com',
  phone: '9999999999',
  password: 'admin123',
  role: 'admin',
  isVerified: true,
  isBlocked: false
};

// Get admin details from command line arguments or use defaults
const getAdminDetails = () => {
  const args = process.argv.slice(2);
  const adminDetails = { ...DEFAULT_ADMIN };

  // Parse command line arguments
  args.forEach((arg) => {
    if (arg.startsWith('--email=')) {
      adminDetails.email = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--name=')) {
      adminDetails.name = arg.split('=')[1];
    } else if (arg.startsWith('--phone=')) {
      adminDetails.phone = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      adminDetails.password = arg.split('=')[1];
    }
  });

  // Ensure default email is also lowercase
  adminDetails.email = adminDetails.email.toLowerCase();

  return adminDetails;
};

const createOrUpdateAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      console.error('Please ensure .env file exists and contains MONGODB_URI');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Get admin details
    const adminDetails = getAdminDetails();
    
    // Normalize email to lowercase for consistency
    const normalizedEmail = adminDetails.email.toLowerCase();

    // Check if admin already exists by email
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      console.log(`\n⚠️  Admin with email "${normalizedEmail}" already exists.`);
      console.log('Updating existing admin...');

      // Update existing admin
      existingAdmin.name = adminDetails.name;
      existingAdmin.phone = adminDetails.phone;
      existingAdmin.email = normalizedEmail;
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      existingAdmin.isBlocked = false;
      
      // Let the pre-save middleware handle password hashing (do NOT pre-hash)
      if (adminDetails.password) {
        existingAdmin.password = adminDetails.password;
        console.log('📝 Password set (will be hashed by middleware)');
      }

      await existingAdmin.save();

      console.log('\n✅ Admin updated successfully!');
      console.log('📋 Admin Details:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Phone: ${existingAdmin.phone}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Verified: ${existingAdmin.isVerified}`);
      console.log(`   Password: ${adminDetails.password ? 'Updated' : 'Unchanged'}`);
    } else {
      // Check if phone number is already taken
      const existingPhone = await User.findOne({ phone: adminDetails.phone });
      if (existingPhone) {
        console.error(`\n❌ Error: Phone number "${adminDetails.phone}" is already registered`);
        console.error('Please use a different phone number or update the existing user.');
        await mongoose.connection.close();
        process.exit(1);
      }

      // Create new admin (do NOT pre-hash password, let the pre-save middleware handle it)
      const admin = await User.create({
        name: adminDetails.name,
        email: normalizedEmail,
        phone: adminDetails.phone,
        password: adminDetails.password,
        role: 'admin',
        isVerified: true,
        isBlocked: false
      });
      console.log('📝 Password set (hashed by middleware)');

      console.log('\n✅ Admin created successfully!');
      console.log('📋 Admin Details:');
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Phone: ${admin.phone}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Verified: ${admin.isVerified}`);
      console.log(`   ID: ${admin._id}`);
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('✨ Process completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating/updating admin:');
    console.error(error.message);
    
    if (error.code === 11000) {
      console.error('\n⚠️  Duplicate key error: Email or phone already exists');
    }

    // Close database connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
};

// Run the script
createOrUpdateAdmin();
