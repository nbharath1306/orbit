// Quick test - fetch from API if available
async function testAPI() {
  try {
    console.log('\n🔍 Checking if API is available...\n');
    
    // Try to fetch owners - this will go through the API
    const response = await fetch('http://localhost:3000/api/admin/users?role=owner', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ API Error:', response.status);
      console.log('💡 Please ensure the dev server is running on http://localhost:3000\n');
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ API is available!\n');
    console.log('Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the dev server is running:\n   npm run dev\n');
    process.exit(1);
  }
}

testAPI();
