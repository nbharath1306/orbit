#!/usr/bin/env node

/**
 * Password Reset Script for Owner Account
 * Use this if you cannot login with the owner account
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const UserSchema = new mongoose.Schema({}, { collection: 'users' });
const User = mongoose.model('User', UserSchema);

async function resetOwnerPassword() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 OWNER PASSWORD RESET UTILITY');
    console.log('='.repeat(80) + '\n');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Find the owner
    const owner = await User.findOne({ email: 'owner@orbit.com' });
    
    if (!owner) {
      throw new Error('Owner account not found');
    }

    console.log(`👤 Found Owner: ${owner.name}`);
    console.log(`📧 Email: ${owner.email}\n`);

    // Set new password
    const newPassword = 'Demo@12345'; // Change this to your desired password

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the database
    owner.password = hashedPassword;
    await owner.save();

    console.log('✅ Password Reset Successfully!\n');
    console.log('New Credentials:');
    console.log(`📧 Email: owner@orbit.com`);
    console.log(`🔐 Password: ${newPassword}\n`);

    console.log('🔗 Login URL: http://localhost:3000/owner-signin\n');

    console.log('=' .repeat(80));
    console.log('✅ PASSWORD RESET COMPLETE');
    console.log('=' .repeat(80) + '\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

resetOwnerPassword();
