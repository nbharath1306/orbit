/**
 * Get detailed booking information
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({}, { 
  strict: false, 
  strictPopulate: false,
  collection: 'bookings' 
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

async function getBookingDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const bookingId = process.argv[2] || '69538e562f7764b694ebf53f';

    const booking = await Booking.findById(bookingId).lean();

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}\n`);
      await mongoose.disconnect();
      return;
    }

    console.log('📋 BOOKING DETAILS:\n');
    console.log(JSON.stringify(booking, null, 2));
    console.log('\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

getBookingDetails();
