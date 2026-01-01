#!/usr/bin/env node

const http = require('http');

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('\n' + '='.repeat(120));
  console.log('🔧 CLEANING UP BOOKINGS & FETCHING OWNER CREDENTIALS');
  console.log('='.repeat(120) + '\n');

  try {
    // Step 1: Get all bookings
    console.log('📋 Step 1: Fetching all bookings...');
    const bookingsResponse = await makeRequest('/api/admin/bookings', 'GET');
    
    if (bookingsResponse.status !== 200) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
    }

    const bookings = bookingsResponse.data.bookings || [];
    console.log(`✅ Found ${bookings.length} bookings\n`);

    // Step 2: Get all users (to extract owners)
    console.log('👥 Step 2: Fetching all owners...');
    const usersResponse = await makeRequest('/api/admin/users?role=owner', 'GET');
    
    if (usersResponse.status !== 200) {
      throw new Error(`Failed to fetch users: ${usersResponse.status}`);
    }

    const users = usersResponse.data.users || usersResponse.data.data || [];
    console.log(`✅ Found ${users.length} owners\n`);

    // Step 3: Display owner credentials
    console.log('=' .repeat(120));
    console.log('👥 OWNER LOGIN CREDENTIALS (for testing):');
    console.log('=' .repeat(120) + '\n');

    if (users.length === 0) {
      console.log('❌ No owners found in database\n');
    } else {
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name || user.email}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔐 Password: ${user.password || 'Not stored in DB (use OAuth or reset)'}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   ✅ Status: ${user.isVerified ? 'Verified' : 'Not Verified'}`);
        console.log();
      });
    }

    // Step 4: Delete bookings
    console.log('=' .repeat(120));
    console.log('🗑️  Step 3: Deleting bookings...\n');

    if (bookings.length > 0) {
      for (const booking of bookings) {
        console.log(`   Deleting booking: ${booking._id}`);
      }
      
      const deleteResponse = await makeRequest('/api/admin/bookings', 'DELETE');
      
      if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        console.log(`\n✅ Successfully deleted ${bookings.length} bookings\n`);
      } else {
        console.log(`\n⚠️  Delete response: ${deleteResponse.status}\n`);
        console.log(JSON.stringify(deleteResponse.data, null, 2));
      }
    } else {
      console.log('✅ No bookings to delete\n');
    }

    // Step 5: Verify deletion
    console.log('📋 Step 4: Verifying deletion...');
    const verifyResponse = await makeRequest('/api/admin/bookings', 'GET');
    const remainingBookings = verifyResponse.data.bookings || [];
    
    console.log(`✅ Remaining bookings: ${remainingBookings.length}\n`);

    console.log('=' .repeat(120));
    console.log('✅ CLEANUP COMPLETE');
    console.log('=' .repeat(120) + '\n');

    console.log('📝 Next Steps:');
    console.log('   1. Login to http://localhost:3000 with any owner account above');
    console.log('   2. Go to Owner Dashboard');
    console.log('   3. Create a student booking from the student account');
    console.log('   4. Check if booking request and message appears in owner dashboard\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure the dev server is running:\n   npm run dev\n');
    process.exit(1);
  }
}

main();
