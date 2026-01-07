/**
 * Debug script to check for existing bookings
 * Run: node debug-user-bookings.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function debugUserBookings() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the current user (you can pass email as argument)
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('Usage: node debug-user-bookings.js <user-email>');
      console.log('\nFetching all users...');
      const users = await User.find().select('email name role').limit(10);
      console.log('\nAvailable users:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
      return;
    }

    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`\n📊 Checking bookings for: ${user.email}`);
    console.log(`User ID: ${user._id}\n`);

    // Find all bookings for this user
    const allBookings = await Booking.find({ studentId: user._id })
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 });

    console.log(`Total bookings: ${allBookings.length}\n`);

    if (allBookings.length === 0) {
      console.log('✅ No bookings found. User can create new bookings.');
      return;
    }

    // Group by status
    const activeStatuses = ['pending', 'confirmed', 'checked-in'];
    const activeBookings = allBookings.filter(b => activeStatuses.includes(b.status));
    const inactiveBookings = allBookings.filter(b => !activeStatuses.includes(b.status));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ACTIVE BOOKINGS (pending/confirmed/checked-in):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (activeBookings.length === 0) {
      console.log('✅ No active bookings. User can create new bookings.\n');
    } else {
      activeBookings.forEach((booking, index) => {
        console.log(`${index + 1}. 🏠 Property: ${booking.propertyId?.title || 'Unknown'}`);
        console.log(`   📋 Status: ${booking.status}`);
        console.log(`   🆔 Booking ID: ${booking._id}`);
        console.log(`   📍 Property ID: ${booking.propertyId?._id || booking.propertyId}`);
        console.log(`   📅 Check-in: ${booking.checkInDate?.toISOString().split('T')[0]}`);
        console.log(`   ⏱️  Duration: ${booking.durationMonths} months`);
        console.log(`   💰 Total: ₹${booking.totalAmount?.toLocaleString()}`);
        console.log(`   🕐 Created: ${booking.createdAt?.toISOString()}`);
        console.log('');
      });

      console.log('⚠️  DUPLICATE BOOKING PREVENTION ACTIVE');
      console.log('These active bookings will prevent new bookings for the same properties.\n');
    }

    if (inactiveBookings.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('INACTIVE BOOKINGS (rejected/cancelled/completed):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      inactiveBookings.slice(0, 5).forEach((booking, index) => {
        console.log(`${index + 1}. 🏠 Property: ${booking.propertyId?.title || 'Unknown'}`);
        console.log(`   📋 Status: ${booking.status}`);
        console.log(`   🆔 Booking ID: ${booking._id}`);
        console.log(`   🕐 Created: ${booking.createdAt?.toISOString()}`);
        console.log('');
      });
    }

    // Show solution
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 SOLUTIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (activeBookings.length > 0) {
      console.log('Option 1: Cancel/Reject the existing booking(s) to allow new bookings:');
      activeBookings.forEach(booking => {
        console.log(`   node cancel-booking.js ${booking._id}`);
      });
      console.log('');
      console.log('Option 2: Try booking a different property');
      console.log('');
      console.log('Option 3: If this is a test environment, clean up test data:');
      console.log(`   node cleanup-bookings.js --user ${user.email}`);
    } else {
      console.log('✅ All clear! User can create new bookings for any property.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugUserBookings();
