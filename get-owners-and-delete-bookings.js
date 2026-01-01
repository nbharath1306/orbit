const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbit';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const userSchema = new mongoose.Schema({}, { strict: false });
const propertySchema = new mongoose.Schema({}, { strict: false });
const bookingSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', userSchema);
const Property = mongoose.model('Property', propertySchema);
const Booking = mongoose.model('Booking', bookingSchema);

async function main() {
  try {
    console.log('\n' + '='.repeat(120));
    console.log('📊 OWNER & PROPERTY DETAILS FOR TESTING');
    console.log('='.repeat(120) + '\n');

    // Get all owners (users with role 'owner')
    const owners = await User.find({ role: 'owner' }).select('name email password');
    
    console.log(`✅ Found ${owners.length} owners\n`);

    const ownerDetails = [];

    for (const owner of owners) {
      console.log(`👤 Owner Name: ${owner.name}`);
      console.log(`📧 Email: ${owner.email}`);
      console.log(`🔐 Password: ${owner.password}`);
      
      // Find properties for this owner
      const properties = await Property.find({ ownerId: owner._id }).select('title location');
      
      if (properties.length > 0) {
        console.log(`🏠 Properties (${properties.length}):`);
        properties.forEach((prop, idx) => {
          console.log(`   ${idx + 1}. ${prop.title}`);
          if (prop.location?.address) {
            console.log(`      📍 ${prop.location.address}`);
          }
        });
      } else {
        console.log(`🏠 Properties: None`);
      }

      ownerDetails.push({
        name: owner.name,
        email: owner.email,
        password: owner.password,
        propertiesCount: properties.length,
      });

      console.log('-'.repeat(120) + '\n');
    }

    // Count existing bookings before deletion
    const bookingCount = await Booking.countDocuments();
    console.log(`\n📋 Total Bookings BEFORE deletion: ${bookingCount}`);

    if (bookingCount > 0) {
      console.log('\n🗑️  Deleting all bookings...');
      const result = await Booking.deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} bookings\n`);
    }

    // Verify deletion
    const newBookingCount = await Booking.countDocuments();
    console.log(`📋 Total Bookings AFTER deletion: ${newBookingCount}\n`);

    console.log('='.repeat(120));
    console.log('✅ ALL BOOKINGS DELETED SUCCESSFULLY');
    console.log('='.repeat(120));
    console.log('\n📌 OWNER LOGIN CREDENTIALS FOR TESTING:\n');
    
    ownerDetails.forEach((owner, idx) => {
      console.log(`${idx + 1}. ${owner.name}`);
      console.log(`   Email: ${owner.email}`);
      console.log(`   Password: ${owner.password}`);
      console.log(`   Properties: ${owner.propertiesCount}\n`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

main();
