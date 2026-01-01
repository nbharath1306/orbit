const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  isVerified: { type: Boolean, default: true },
});

const propertySchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  price: { amount: Number },
});

const User = mongoose.model('User', userSchema);
const Property = mongoose.model('Property', propertySchema);

async function createThreeOwners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create 3 owner accounts
    const owners = [
      {
        name: 'Sai Owner',
        email: 'sai-owner@orbit.com',
        password: 'Sai@12345',
      },
      {
        name: 'DSU Owner',
        email: 'dsu-owner@orbit.com',
        password: 'DSU@12345',
      },
      {
        name: 'Green Owner',
        email: 'green-owner@orbit.com',
        password: 'Green@12345',
      },
    ];

    // Delete existing owners if they exist
    await User.deleteMany({
      email: {
        $in: [
          'sai-owner@orbit.com',
          'dsu-owner@orbit.com',
          'green-owner@orbit.com',
        ],
      },
    });

    // Create new owners
    const createdOwners = [];
    for (const ownerData of owners) {
      const hashedPassword = await bcrypt.hash(ownerData.password, 10);
      const owner = new User({
        name: ownerData.name,
        email: ownerData.email,
        password: hashedPassword,
        role: 'owner',
        isVerified: true,
      });
      await owner.save();
      createdOwners.push({ ...ownerData, _id: owner._id });
      console.log(`✅ Created owner: ${ownerData.name}`);
    }

    // Get all properties
    const properties = await Property.find();
    console.log(`\n📦 Found ${properties.length} properties`);

    if (properties.length >= 3) {
      // Assign each property to a different owner
      properties[0].ownerId = createdOwners[0]._id;
      await properties[0].save();
      console.log(`✅ Assigned "${properties[0].title}" to ${createdOwners[0].name}`);

      properties[1].ownerId = createdOwners[1]._id;
      await properties[1].save();
      console.log(`✅ Assigned "${properties[1].title}" to ${createdOwners[1].name}`);

      properties[2].ownerId = createdOwners[2]._id;
      await properties[2].save();
      console.log(
        `✅ Assigned "${properties[2].title}" to ${createdOwners[2].name}`
      );
    }

    console.log('\n' + '='.repeat(60));
    console.log('👥 THREE OWNER CREDENTIALS:');
    console.log('='.repeat(60));

    createdOwners.forEach((owner, index) => {
      console.log(`\n👤 Owner ${index + 1}: ${owner.name}`);
      console.log(`📧 Email: ${owner.email}`);
      console.log(`🔐 Password: ${owner.password}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🔗 LOGIN URL: http://localhost:3000/owner-signin');
    console.log('='.repeat(60));

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createThreeOwners();
