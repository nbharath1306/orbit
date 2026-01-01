const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://sa20040404:1122%40Faizan@bookings.mgjsr.mongodb.net/orbit-db?retryWrites=true&w=majority&appName=bookings')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Get all messages
    const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false, collection: 'messages' }));
    const messages = await Message.find({}).limit(5).lean();
    
    console.log('\n📧 Recent Messages:');
    messages.forEach((msg, i) => {
      console.log(`\n${i + 1}. Message:`);
      console.log('   Thread ID:', msg.threadId);
      console.log('   Student ID:', msg.studentId);
      console.log('   Owner ID:', msg.ownerId);
      console.log('   Sender Role:', msg.senderRole);
      console.log('   Message:', msg.message);
      console.log('   Read:', msg.read);
    });
    
    // Check Users
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
    const users = await User.find({}).select('_id name email role').lean();
    
    console.log('\n\n👥 Users in DB:');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
