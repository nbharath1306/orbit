/**
 * Debug Script: Check Active Bookings
 * 
 * Usage: node check-active-bookings.js <userEmail> <propertyId>
 * 
 * This script checks for existing active bookings that might be preventing
 * new booking creation.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Check if required environment variables exist
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Define minimal schemas with strictPopulate disabled
const bookingSchema = new mongoose.Schema({}, { 
  strict: false, 
  strictPopulate: false,
  collection: 'bookings' 
});
const userSchema = new mongoose.Schema({}, { 
  strict: false, 
  strictPopulate: false,
  collection: 'users' 
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function checkActiveBookings() {
  try {
    console.log('🔍 Connecting to database...\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get command line arguments
    const userEmail = process.argv[2];
    const propertyId = process.argv[3];

    if (!userEmail) {
      console.log('Usage: node check-active-bookings.js <userEmail> [propertyId]');
      console.log('\nExample:');
      console.log('  node check-active-bookings.js user@example.com');
      console.log('  node check-active-bookings.js user@example.com 507f1f77bcf86cd799439011\n');
      
      // Show all active bookings
      console.log('📋 Showing all active bookings:\n');
      const allBookings = await Booking.find({
        status: { $in: ['pending', 'confirmed', 'checked-in'] }
      })
      .populate('studentId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

      if (allBookings.length === 0) {
        console.log('✅ No active bookings found in the database\n');
      } else {
        console.log(`Found ${allBookings.length} active booking(s):\n`);
        allBookings.forEach((booking, index) => {
          console.log(`${index + 1}. Booking ID: ${booking._id}`);
          console.log(`   User: ${booking.studentId?.name || 'Unknown'} (${booking.studentId?.email || 'N/A'})`);
          console.log(`   Property: ${booking.propertyId?.title || 'Unknown'}`);
          console.log(`   Status: ${booking.status}`);
          console.log(`   Created: ${booking.createdAt || 'N/A'}`);
          console.log('');
        });
      }

      await mongoose.disconnect();
      return;
    }

    // Find user
    console.log(`👤 Looking up user: ${userEmail}`);
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${userEmail}\n`);
      await mongoose.disconnect();
      return;
    }
    
    console.log(`✅ User found: ${user.name} (${user._id})\n`);

    // Build query
    const query = {
      studentId: user._id,
      status: { $in: ['pending', 'confirmed', 'checked-in'] }
    };

    if (propertyId) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        console.log(`❌ Invalid property ID format: ${propertyId}\n`);
        await mongoose.disconnect();
        return;
      }
      query.propertyId = new mongoose.Types.ObjectId(propertyId);
      console.log(`🏠 Checking for bookings for specific property: ${propertyId}\n`);
    } else {
      console.log(`🏠 Checking for all active bookings for this user\n`);
    }

    // Find active bookings
    const activeBookings = await Booking.find(query)
      .populate('propertyId', 'title slug location')
      .sort({ createdAt: -1 });

    console.log('='.repeat(60));
    console.log(`📊 RESULTS: Found ${activeBookings.length} active booking(s)`);
    console.log('='.repeat(60));
    console.log('');

    if (activeBookings.length === 0) {
      console.log('✅ No active bookings found for this user/property');
      console.log('   → User should be able to create a new booking\n');
    } else {
      console.log('⚠️  Active bookings found (preventing new bookings):\n');
      
      activeBookings.forEach((booking, index) => {
        console.log(`Booking #${index + 1}:`);
        console.log(`  ID: ${booking._id}`);
        console.log(`  Property: ${booking.propertyId?.title || 'Unknown'}`);
        console.log(`  Property ID: ${booking.propertyId?._id || booking.propertyId}`);
        console.log(`  Status: ${booking.status}`);
        console.log(`  Check-in: ${booking.checkInDate || 'N/A'}`);
        console.log(`  Duration: ${booking.durationMonths || 0} months`);
        console.log(`  Created: ${booking.createdAt || 'N/A'}`);
        console.log(`  Payment Status: ${booking.paymentStatus || 'N/A'}`);
        console.log('');
      });

      console.log('💡 SOLUTION OPTIONS:\n');
      console.log('1. Cancel existing booking(s) if they are invalid');
      console.log('2. Change booking status to "cancelled" or "completed"');
      console.log('3. Delete the booking(s) if they are test data\n');
      
      console.log('🔧 To fix, you can:');
      activeBookings.forEach((booking, index) => {
        console.log(`\n   Option ${index + 1}: Update booking ${booking._id}`);
        console.log(`   Run: node cleanup-bookings.js ${booking._id}`);
      });
      console.log('');
    }

    // Show booking statistics
    const allUserBookings = await Booking.countDocuments({ studentId: user._id });
    const cancelledBookings = await Booking.countDocuments({ 
      studentId: user._id, 
      status: 'cancelled' 
    });
    const completedBookings = await Booking.countDocuments({ 
      studentId: user._id, 
      status: 'completed' 
    });

    console.log('📈 User Booking Statistics:');
    console.log(`   Total bookings: ${allUserBookings}`);
    console.log(`   Active: ${activeBookings.length}`);
    console.log(`   Cancelled: ${cancelledBookings}`);
    console.log(`   Completed: ${completedBookings}`);
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Database connection closed\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
checkActiveBookings();
