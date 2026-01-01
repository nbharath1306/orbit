const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Schemas matching the actual database structure
const UserSchema = new mongoose.Schema({}, { collection: 'users' });
const PropertySchema = new mongoose.Schema({}, { collection: 'properties' });
const BookingSchema = new mongoose.Schema({}, { collection: 'bookings' });

const User = mongoose.model('User', UserSchema);
const Property = mongoose.model('Property', PropertySchema);
const Booking = mongoose.model('Booking', BookingSchema);

async function cleanupAndFetchOwners() {
  try {
    console.log('\n' + '='.repeat(120));
    console.log('🔧 CLEANING UP BOOKINGS & FETCHING OWNER CREDENTIALS');
    console.log('='.repeat(120) + '\n');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Get all bookings count
    console.log('📋 Step 1: Checking bookings...');
    const bookingCount = await Booking.countDocuments();
    console.log(`Found ${bookingCount} bookings\n`);

    // Step 2: Get all owners with their properties
    console.log('👥 Step 2: Fetching all owners with their properties...');
    const owners = await User.find({ role: 'owner' }).lean();
    console.log(`✅ Found ${owners.length} owners\n`);

    // Display owner credentials
    console.log('=' .repeat(120));
    console.log('👥 OWNER LOGIN CREDENTIALS (for testing):');
    console.log('=' .repeat(120) + '\n');

    if (owners.length === 0) {
      console.log('❌ No owners found in database\n');
    } else {
      for (let i = 0; i < owners.length; i++) {
        const owner = owners[i];
        const properties = await Property.find({ ownerId: owner._id }).lean();
        
        console.log(`${i + 1}. Owner: ${owner.name || 'N/A'}`);
        console.log(`   📧 Email: ${owner.email}`);
        console.log(`   🔐 Password: ${owner.password || 'N/A (use OAuth or password reset)'}`);
        console.log(`   🏠 Properties: ${properties.length}`);
        
        if (properties.length > 0) {
          properties.forEach((prop, idx) => {
            const address = prop.location?.address || prop.location || 'No location';
            console.log(`      ${idx + 1}. ${prop.title} - ${address}`);
          });
        }
        console.log();
      }
    }

    // Step 3: Delete all bookings
    console.log('=' .repeat(120));
    console.log('🗑️  Step 3: Deleting all bookings...\n');

    if (bookingCount > 0) {
      const result = await Booking.deleteMany({});
      console.log(`✅ Successfully deleted ${result.deletedCount} bookings\n`);
    } else {
      console.log('✅ No bookings to delete\n');
    }

    // Step 4: Verify deletion
    console.log('📋 Step 4: Verifying deletion...');
    const newBookingCount = await Booking.countDocuments();
    console.log(`✅ Remaining bookings: ${newBookingCount}\n`);

    console.log('=' .repeat(120));
    console.log('✅ CLEANUP COMPLETE');
    console.log('=' .repeat(120) + '\n');

    console.log('📝 NEXT STEPS FOR TESTING:');
    console.log('   1. Go to http://localhost:3000/owner-signin');
    console.log('   2. Login with any owner account above');
    console.log('   3. Navigate to Owner Dashboard');
    console.log('   4. Create a booking from a student account');
    console.log('   5. Check if booking request appears in owner dashboard');
    console.log('   6. Check if messages are reaching the owner\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Make sure .env.local file exists with MONGODB_URI');
    console.log('   - Make sure MongoDB Atlas is accessible');
    console.log('   - Run: npm run dev (to start the dev server)\n');
    process.exit(1);
  }
}

cleanupAndFetchOwners();
