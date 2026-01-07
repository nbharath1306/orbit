/**
 * Cancel a specific test booking
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const bookingSchema = new mongoose.Schema({}, { 
  strict: false, 
  strictPopulate: false,
  collection: 'bookings' 
});

const propertySchema = new mongoose.Schema({}, { 
  strict: false, 
  strictPopulate: false,
  collection: 'properties' 
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
const Property = mongoose.models.Property || mongoose.model('Property', propertySchema);

async function cancelBooking() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const bookingId = process.argv[2] || '69538e562f7764b694ebf53f';

    // Get booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}\n`);
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 Cancelling booking: ${bookingId}`);
    console.log(`   Status: ${booking.status} → cancelled`);
    console.log(`   Property: ${booking.propertyId}`);
    console.log(`   Room Type: ${booking.roomType}\n`);

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = booking.studentId; // Cancelled by student
    booking.cancellationReason = 'Test booking cleanup';
    await booking.save();

    console.log('✅ Booking cancelled\n');

    // Update property occupancy
    if (booking.propertyId) {
      const property = await Property.findById(booking.propertyId);
      if (property) {
        console.log(`📦 Updating property occupancy...`);
        
        // Find the room and decrement occupied count
        if (property.rooms && Array.isArray(property.rooms)) {
          const room = property.rooms.find(r => r.type === booking.roomType);
          if (room && room.occupied > 0) {
            room.occupied -= 1;
            await property.save();
            console.log(`   ${booking.roomType} room: ${room.occupied + 1} → ${room.occupied} occupied`);
          }
        }
        
        console.log('✅ Property updated\n');
      } else {
        console.log('⚠️  Property not found, skipping occupancy update\n');
      }
    }

    console.log('✅ DONE! You can now create new bookings.\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cancelBooking();
