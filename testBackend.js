// A simple script to test the backend API
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Try multiple potential API endpoints
const apiUrls = [
  'http://localhost:5300/api/Books',  // Updated port
  'https://localhost:7300/api/Books',  // Updated port
  'http://localhost:5200/api/Books',  // Old explicit port we were using
  'https://localhost:7043/api/Books',
  'http://localhost:5017/api/Books',
  'https://localhost:5001/api/Books',
  'http://localhost:5000/api/Books',
  'https://localhost:44385/api/Books'  // IIS Express SSL port from launchSettings.json
];

// Function to check if the database file exists
function checkDatabase() {
  console.log('\n=== DATABASE CHECK ===');
  const dbPath = path.join(__dirname, 'backend', 'BookStoreProject', 'Bookstore.sqlite');
  
  try {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`✅ Database file found: ${dbPath}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Created: ${stats.birthtime}`);
      console.log(`   Modified: ${stats.mtime}`);
      return true;
    } else {
      console.log(`❌ Database file not found at: ${dbPath}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error checking database file: ${err.message}`);
    return false;
  }
}

// Function to test the API with specific options to handle self-signed certificates
async function testApi(url) {
  console.log(`\nTesting API at: ${url}`);
  try {
    // Set a timeout and ignore SSL certificate errors
    const response = await axios.get(url, {
      params: {
        pageNumber: 1,
        pageSize: 5,
        sortField: 'title',
        sortOrder: 'asc'
      },
      timeout: 5000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    
    console.log(`✅ SUCCESS for ${url}`);
    console.log('Status:', response.status);
    
    if (response.data && response.data.books) {
      console.log(`Books count: ${response.data.books.length}`);
      console.log('First book:', response.data.books[0]);
    } else {
      console.log('Response data:', response.data);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ERROR for ${url}`);
    if (error.response) {
      // The request was made and the server responded with a status code
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received:', error.message);
    } else {
      // Something happened in setting up the request
      console.log('Error setting up request:', error.message);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('=== BACKEND API TEST ===');
  
  // Check the database first
  const dbExists = checkDatabase();
  if (!dbExists) {
    console.log('\n⚠️ Warning: Database file not found, API might not work properly.');
  }
  
  console.log('\n=== API ENDPOINT TESTS ===');
  let success = false;
  
  for (const url of apiUrls) {
    const result = await testApi(url);
    if (result) {
      success = true;
      break;
    }
  }
  
  if (success) {
    console.log('\n✅ API is working on at least one endpoint!');
  } else {
    console.log('\n❌ API is not responding on any endpoint!');
    console.log('\nTROUBLESHOOTING STEPS:');
    console.log('1. Make sure your backend is running (npm run backend)');
    console.log('2. Check that the database exists and has the correct schema');
    console.log('3. Verify the connection string in appsettings.json');
    console.log('4. Look for error messages in the backend console output');
  }
}

runTests().catch(console.error); 