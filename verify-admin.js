
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

async function verifyAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log('Admin found:', {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      });
    } else {
      console.log('No admin user found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAdmin();
