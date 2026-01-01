#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Create User model inline
    const UserSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      image: String,
      role: { type: String, enum: ['student', 'owner', 'admin'], default: 'student' },
      isVerified: { type: Boolean, default: false },
      phone: String,
      university: String,
      blacklisted: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', UserSchema);

    // Test owner credentials
    const testOwners = [
      {
        email: 'sai-owner@orbit.com',
        password: 'SaiOwner@123',
        name: 'Sai Balaji PG'
      },
      {
        email: 'dsu-owner@orbit.com',
        password: 'DSUOwner@123',
        name: 'DSU Hostels'
      },
      {
        email: 'green-owner@orbit.com',
        password: 'GreenOwner@123',
        name: 'Green View Residency'
      }
    ];

    console.log('\n📝 Creating test owner accounts...\n');

    for (const owner of testOwners) {
      try {
        // Check if user exists
        let user = await User.findOne({ email: owner.email });
        
        if (user) {
          // Update password
          const hashedPassword = await bcrypt.hash(owner.password, 10);
          user.password = hashedPassword;
          user.role = 'owner';
          user.isVerified = true;
          await user.save();
          console.log(`✅ Updated: ${owner.email}`);
          console.log(`   Password: ${owner.password}\n`);
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(owner.password, 10);
          await User.create({
            email: owner.email,
            password: hashedPassword,
            name: owner.name,
            role: 'owner',
            isVerified: true
          });
          console.log(`✅ Created: ${owner.email}`);
          console.log(`   Password: ${owner.password}\n`);
        }
      } catch (error) {
        console.error(`❌ Error with ${owner.email}:`, error.message);
      }
    }

    console.log('\n='.repeat(50));
    console.log('TEST OWNER CREDENTIALS');
    console.log('='.repeat(50));
    console.log('\n1️⃣  Sai Balaji PG');
    console.log('   Email: sai-owner@orbit.com');
    console.log('   Password: SaiOwner@123\n');
    console.log('2️⃣  DSU Hostels');
    console.log('   Email: dsu-owner@orbit.com');
    console.log('   Password: DSUOwner@123\n');
    console.log('3️⃣  Green View Residency');
    console.log('   Email: green-owner@orbit.com');
    console.log('   Password: GreenOwner@123\n');
    console.log('='.repeat(50));
    console.log('\nAccess owner dashboard: http://localhost:3000/owner/dashboard');
    console.log('='.repeat(50) + '\n');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  })
  .catch(error => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
