const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  image: String,
  role: String,
  isVerified: Boolean,
  university: String,
  phone: String,
  bio: String,
});

const User = mongoose.model('User', userSchema);

async function createMockUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create user@orbit.com
    await User.findOneAndUpdate(
      { email: 'user@orbit.com' },
      {
        email: 'user@orbit.com',
        name: 'Demo User',
        role: 'student',
        isVerified: true,
        university: 'Demo University',
      },
      { upsert: true }
    );
    console.log('✓ user@orbit.com created');

    // Create owner@orbit.com
    await User.findOneAndUpdate(
      { email: 'owner@orbit.com' },
      {
        email: 'owner@orbit.com',
        name: 'Demo Owner',
        role: 'owner',
        isVerified: true,
        university: 'Demo University',
      },
      { upsert: true }
    );
    console.log('✓ owner@orbit.com created');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createMockUsers();
