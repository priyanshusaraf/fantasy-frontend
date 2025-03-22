/**
 * This script tests authentication with the updated NEXTAUTH_SECRET
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Set test parameters
const TEST_EMAIL = 'sarafpriyanshu09@gmail.com';
const TEST_PASSWORD = 'matchupsports';

// Functions to validate required env variables
function checkEnvVariables() {
  const variables = ['NEXTAUTH_SECRET', 'JWT_SECRET', 'NEXTAUTH_URL'];
  
  console.log('\n=== Environment Variables ===');
  
  let allPresent = true;
  variables.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`❌ ${varName} is missing`);
      allPresent = false;
    } else {
      console.log(`✅ ${varName} is set to: ${varName === 'NEXTAUTH_SECRET' || varName === 'JWT_SECRET' 
        ? process.env[varName].substring(0, 3) + '...' + process.env[varName].substring(process.env[varName].length - 3) 
        : process.env[varName]}`);
    }
  });
  
  // Check if JWT_SECRET and NEXTAUTH_SECRET match
  if (process.env.JWT_SECRET && process.env.NEXTAUTH_SECRET) {
    if (process.env.JWT_SECRET === process.env.NEXTAUTH_SECRET) {
      console.log('✅ JWT_SECRET and NEXTAUTH_SECRET match');
    } else {
      console.log('❌ JWT_SECRET and NEXTAUTH_SECRET do not match - this can cause authentication issues');
    }
  }
  
  return allPresent;
}

// Main test function
async function testAuthentication() {
  console.log('\n🔑 TESTING AUTHENTICATION FLOW\n');
  
  // Check environment variables
  const envCheck = checkEnvVariables();
  if (!envCheck) {
    console.log('\n❌ Environment variable check failed - fix these issues first.');
    process.exit(1);
  }
  
  try {
    // Step 1: Find user in database
    console.log('\n=== User Lookup ===');
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        status: true
      }
    });
    
    if (!user) {
      console.log(`❌ User with email ${TEST_EMAIL} not found`);
      process.exit(1);
    }
    
    console.log(`✅ User found: ID ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Role: ${user.role || 'Not set'}`);
    console.log(`   Status: ${user.status || 'Not set'}`);
    
    // Step 2: Verify password
    console.log('\n=== Password Verification ===');
    if (!user.password) {
      console.log('❌ User has no password set');
      process.exit(1);
    }
    
    const passwordMatch = await bcrypt.compare(TEST_PASSWORD, user.password);
    if (!passwordMatch) {
      console.log('❌ Password does not match');
      process.exit(1);
    }
    
    console.log('✅ Password verification successful');
    
    // Step 3: Create JWT token (similar to NextAuth)
    console.log('\n=== JWT Token Creation ===');
    const token = jwt.sign(
      {
        sub: user.id.toString(),
        email: user.email,
        role: user.role || 'USER',
        isAdmin: user.role === 'ADMIN' || user.role === 'MASTER_ADMIN',
        isActive: user.status === 'ACTIVE',
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log(`✅ JWT token created: ${token.substring(0, 12)}...`);
    
    // Step 4: Verify the token
    console.log('\n=== JWT Token Verification ===');
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      console.log('✅ Token verification successful');
      console.log(`   User ID: ${decoded.sub}`);
      console.log(`   Email: ${decoded.email}`);
      console.log(`   Role: ${decoded.role}`);
      console.log(`   Is Admin: ${decoded.isAdmin}`);
      console.log(`   Is Active: ${decoded.isActive}`);
      console.log(`   Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
    } catch (err) {
      console.log(`❌ Token verification failed: ${err.message}`);
      process.exit(1);
    }
    
    console.log('\n✅ AUTHENTICATION TEST SUCCESSFUL');
    console.log('\nIf this test passes but login still fails in the browser:');
    console.log('1. Clear your browser cookies and cache');
    console.log('2. Try using an incognito/private window');
    console.log('3. Check that your deployment environment variables match these test values');
    console.log('4. Ensure your domain configuration is consistent (www vs non-www)');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuthentication(); 