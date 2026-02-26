import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ServiceCategory from '../src/models/ServiceCategory.model.js';

dotenv.config();

const healthcareServices = [
  {
    name: 'General Health Checkup',
    description: 'Comprehensive health examination including vital signs, blood pressure, and basic health assessment by a qualified healthcare professional.',
    icon: 'FiHeart',
    basePrice: 499,
    duration: 30,
    category: 'healthcare',
    tags: ['checkup', 'preventive', 'general'],
  },
  {
    name: 'Doctor Consultation',
    description: 'One-on-one consultation with a licensed physician for diagnosis, treatment recommendations, and medical advice.',
    icon: 'FiUser',
    basePrice: 599,
    duration: 20,
    category: 'healthcare',
    tags: ['consultation', 'doctor', 'medical'],
  },
  {
    name: 'Elderly Care',
    description: 'Specialized care services for senior citizens including medication management, mobility assistance, and daily health monitoring.',
    icon: 'FiUsers',
    basePrice: 899,
    duration: 60,
    category: 'healthcare',
    tags: ['elderly', 'senior', 'care'],
  },
  {
    name: 'Post-Surgery Care',
    description: 'Professional post-operative care including wound dressing, medication administration, and recovery monitoring at home.',
    icon: 'FiActivity',
    basePrice: 1299,
    duration: 60,
    category: 'healthcare',
    tags: ['surgery', 'recovery', 'post-op'],
  },
  {
    name: 'Physiotherapy',
    description: 'Physical therapy sessions for rehabilitation, pain management, and mobility improvement by certified physiotherapists.',
    icon: 'FiAward',
    basePrice: 799,
    duration: 45,
    category: 'healthcare',
    tags: ['physio', 'rehabilitation', 'therapy'],
  },
  {
    name: 'Nursing Care',
    description: 'Professional nursing services including injection administration, IV fluids, wound care, and vital monitoring.',
    icon: 'FiHeart',
    basePrice: 699,
    duration: 45,
    category: 'healthcare',
    tags: ['nursing', 'injection', 'iv'],
  },
  {
    name: 'Diabetes Care',
    description: 'Specialized care for diabetic patients including blood sugar monitoring, diet guidance, and medication management.',
    icon: 'FiDroplet',
    basePrice: 599,
    duration: 30,
    category: 'healthcare',
    tags: ['diabetes', 'sugar', 'monitoring'],
  },
  {
    name: 'Lab Sample Collection',
    description: 'Home collection of blood, urine, and other samples for laboratory testing by trained phlebotomists.',
    icon: 'FiDroplet',
    basePrice: 199,
    duration: 15,
    category: 'healthcare',
    tags: ['lab', 'sample', 'blood'],
  },
];

const homeServices = [
  {
    name: 'Deep House Cleaning',
    description: 'Thorough cleaning of entire house including floors, bathrooms, kitchen, and all living spaces with eco-friendly products.',
    icon: 'FiHome',
    basePrice: 1499,
    duration: 180,
    category: 'home_service',
    tags: ['cleaning', 'deep-clean', 'house'],
  },
  {
    name: 'AC Service & Repair',
    description: 'Complete air conditioner servicing including gas refill, filter cleaning, and minor repairs by certified technicians.',
    icon: 'FiWind',
    basePrice: 599,
    duration: 60,
    category: 'home_service',
    tags: ['ac', 'repair', 'cooling'],
  },
  {
    name: 'Plumbing Services',
    description: 'Expert plumbing solutions for leaks, pipe repairs, bathroom fittings, and drainage issues.',
    icon: 'FiDroplet',
    basePrice: 399,
    duration: 45,
    category: 'home_service',
    tags: ['plumbing', 'leak', 'pipes'],
  },
  {
    name: 'Electrical Work',
    description: 'Safe electrical services including wiring, fixture installation, repair, and electrical safety inspection.',
    icon: 'FiZap',
    basePrice: 349,
    duration: 45,
    category: 'home_service',
    tags: ['electrical', 'wiring', 'safety'],
  },
  {
    name: 'Appliance Repair',
    description: 'Repair services for washing machines, refrigerators, microwaves, and other home appliances.',
    icon: 'FiTool',
    basePrice: 449,
    duration: 60,
    category: 'home_service',
    tags: ['appliance', 'repair', 'maintenance'],
  },
  {
    name: 'Pest Control',
    description: 'Comprehensive pest control treatment for cockroaches, termites, bed bugs, and other pests using safe chemicals.',
    icon: 'FiShield',
    basePrice: 899,
    duration: 90,
    category: 'home_service',
    tags: ['pest', 'control', 'fumigation'],
  },
  {
    name: 'Carpentry Services',
    description: 'Professional carpentry work including furniture repair, assembly, door/window fixes, and custom woodwork.',
    icon: 'FiTool',
    basePrice: 499,
    duration: 60,
    category: 'home_service',
    tags: ['carpentry', 'furniture', 'woodwork'],
  },
  {
    name: 'Painting Services',
    description: 'Interior and exterior painting services with premium quality paints and professional finish.',
    icon: 'FiDroplet',
    basePrice: 2499,
    duration: 240,
    category: 'home_service',
    tags: ['painting', 'interior', 'exterior'],
  },
];

const seedServices = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    const allServices = [...healthcareServices, ...homeServices];
    
    console.log(`\n📦 Seeding ${allServices.length} services...`);
    
    let created = 0;
    let skipped = 0;

    for (const service of allServices) {
      const existing = await ServiceCategory.findOne({ name: service.name });
      
      if (existing) {
        console.log(`   ⏭️  "${service.name}" already exists, skipping`);
        skipped++;
        continue;
      }

      await ServiceCategory.create(service);
      console.log(`   ✅ Created: "${service.name}" - ₹${service.basePrice}`);
      created++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${allServices.length}`);

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('✨ Seeding completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding services:');
    console.error(error.message);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedServices();
