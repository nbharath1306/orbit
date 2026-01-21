import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

async function verifyUser(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (user) {
      console.log('User found:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      });
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const email = args[0] || 'test@example.com';

verifyUser(email);
