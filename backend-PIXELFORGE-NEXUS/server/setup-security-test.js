#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 PixelForge Nexus Security Test Setup');
console.log('=====================================\n');

// Check if we're in the correct directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the server directory.');
  process.exit(1);
}

// Check if server is running
const checkServer = async () => {
  const axios = require('axios');
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('⚠️  Server is not responding. Make sure your backend server is running.');
    console.log('   You can start it with: npm start');
    return false;
  }
};

const installDependencies = () => {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install colors', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
};

const runSecurityTests = () => {
  console.log('🧪 Starting security tests...\n');
  try {
    execSync('node security-test.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Security tests completed with issues');
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  try {
    // Install dependencies
    installDependencies();
    
    // Check server
    const serverRunning = await checkServer();
    if (!serverRunning) {
      console.log('\n📝 To start your server:');
      console.log('   1. Make sure MongoDB is running');
      console.log('   2. Run: npm start');
      console.log('   3. Then run the security tests again');
      return;
    }
    
    // Run security tests
    runSecurityTests();
    
    console.log('\n🎉 Security testing completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
};

main();
