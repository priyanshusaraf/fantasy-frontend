/**
 * This script helps troubleshoot login issues by testing various aspects of the auth system
 * Run with: NODE_ENV=production NEXTAUTH_SECRET=a8c59bb1d44e6fb9b39e1f25e6dd5281 node src/scripts/troubleshoot-login.js
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const https = require('https');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

// Overrides from command line
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'a8c59bb1d44e6fb9b39e1f25e6dd5281';

const prisma = new PrismaClient();

async function checkSecuritySettings() {
  console.log('\n🔒 SECURITY SETTINGS');
  
  // Check secure cookies
  const nextAuthUrl = process.env.NEXTAUTH_URL || '';
  const isHttps = nextAuthUrl.startsWith('https://');
  console.log(`Using HTTPS protocol: ${isHttps ? '✅ Yes' : '❌ No'}`);

  // If using HTTPS, determine if cookies require secure flag
  if (isHttps) {
    console.log(`Cookie secure flag should be set: ✅ Yes (for HTTPS)`);
  } else {
    console.log(`Cookie secure flag issues: ❌ Possible issue (not using HTTPS)`);
  }

  // Check domain configuration
  const domain = new URL(nextAuthUrl || 'https://example.com').hostname;
  console.log(`Cookie domain: ${domain}`);

  // Check if using a subdomain
  const isSubdomain = domain.split('.').length > 2;
  if (isSubdomain) {
    console.log(`Subdomain detected: ⚠️ May require explicit cookie domain config`);
  }

  // Test CORS headers
  if (nextAuthUrl) {
    try {
      console.log(`\nTesting CORS on ${nextAuthUrl}/api/auth/session...`);
      await new Promise((resolve) => {
        const req = https.get(`${nextAuthUrl}/api/auth/session`, {
          headers: {
            'Origin': 'https://example.com'
          }
        }, (res) => {
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'Not set'}`);
          console.log(`  Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'Not set'}`);
          resolve();
        });
        
        req.on('error', (e) => {
          console.log(`  CORS test error: ${e.message}`);
          resolve();
        });
        
        req.end();
      });
    } catch (error) {
      console.log(`  Error testing CORS: ${error.message}`);
    }
  }
}

async function testDatabase() {
  console.log('\n📊 DATABASE CONNECTION');
  
  try {
    await prisma.$connect();
    console.log('Database connection: ✅ Successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`User count in database: ${userCount}`);
    
    // Test specific user lookup
    const testUser = await prisma.user.findUnique({
      where: { email: 'sarafpriyanshu09@gmail.com' },
      select: { id: true, email: true, role: true, status: true }
    });
    
    if (testUser) {
      console.log(`Test user found: ✅ Yes`);
      console.log(`  ID: ${testUser.id}`);
      console.log(`  Email: ${testUser.email}`);
      console.log(`  Role: ${testUser.role}`);
      console.log(`  Status: ${testUser.status}`);
    } else {
      console.log(`Test user found: ❌ Not found`);
    }
  } catch (error) {
    console.log(`Database connection: ❌ Failed`);
    console.error(`  Error: ${error.message}`);
  }
}

async function testTokenGeneration() {
  console.log('\n🔑 JWT TOKEN TEST');
  
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '*'.repeat(process.env.NEXTAUTH_SECRET.length - 8) + process.env.NEXTAUTH_SECRET.slice(-8) : 'Not set'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '*'.repeat(process.env.JWT_SECRET.length - 8) + process.env.JWT_SECRET.slice(-8) : 'Not set'}`);
  
  // Create a test token
  const payload = {
    id: 1,
    email: 'sarafpriyanshu09@gmail.com',
    role: 'TOURNAMENT_ADMIN'
  };
  
  try {
    // Generate with NEXTAUTH_SECRET
    const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET, { expiresIn: '1h' });
    console.log(`JWT generation with NEXTAUTH_SECRET: ✅ Success`);
    
    // Verify with NEXTAUTH_SECRET
    const verified = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    console.log(`JWT verification with NEXTAUTH_SECRET: ✅ Success`);
    
    // Generate cookie
    console.log(`\nSample cookie configuration that should be used:`);
    console.log(`  session: {`);
    console.log(`    cookie: {`);
    console.log(`      secure: ${process.env.NEXTAUTH_URL?.startsWith('https://') ? 'true' : 'false'},`);
    console.log(`      sameSite: "lax",`);
    console.log(`      domain: "${new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').hostname}",`);
    console.log(`      path: "/",`);
    console.log(`      maxAge: 30 * 24 * 60 * 60 // 30 days`);
    console.log(`    }`);
    console.log(`  }`);
    
  } catch (error) {
    console.log(`JWT tests: ❌ Failed`);
    console.error(`  Error: ${error.message}`);
  }
}

async function testPasswordVerification() {
  console.log('\n🔐 PASSWORD VERIFICATION');
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'sarafpriyanshu09@gmail.com' },
      select: { password: true }
    });
    
    if (!user || !user.password) {
      console.log(`Password hash: ❌ Not found`);
      return;
    }
    
    const passwordToTest = 'matchupsports';
    console.log(`Password hash in DB: ${user.password.substring(0, 10)}...`);
    
    // Test password match
    const isMatch = await bcrypt.compare(passwordToTest, user.password);
    console.log(`Password verification: ${isMatch ? '✅ Match' : '❌ Mismatch'}`);
    
    // Generate new hash for comparison
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(passwordToTest, salt);
    console.log(`New hash for same password: ${newHash.substring(0, 10)}...`);
    
  } catch (error) {
    console.log(`Password verification: ❌ Failed`);
    console.error(`  Error: ${error.message}`);
  }
}

async function checkEnvironment() {
  console.log('\n🌐 ENVIRONMENT');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  
  // Check if JWT_SECRET differs from NEXTAUTH_SECRET
  if (process.env.JWT_SECRET && process.env.NEXTAUTH_SECRET && 
      process.env.JWT_SECRET !== process.env.NEXTAUTH_SECRET) {
    console.log(`⚠️ Warning: JWT_SECRET differs from NEXTAUTH_SECRET`);
  }
  
  // Check if running in production mode
  if (process.env.NODE_ENV === 'production') {
    console.log(`✅ Running in production mode as expected`);
  } else {
    console.log(`⚠️ Not running in production mode, this may affect behavior`);
  }
}

async function runAllChecks() {
  console.log('🔍 NEXTAUTH LOGIN TROUBLESHOOTER');
  console.log('================================');
  
  await checkEnvironment();
  await checkSecuritySettings();
  await testDatabase();
  await testTokenGeneration();
  await testPasswordVerification();
  
  console.log('\n✅ All checks completed');
  
  // Provide advice
  console.log('\n🔧 RECOMMENDATIONS');
  console.log('1. Ensure NEXTAUTH_SECRET is exactly the same between local and deployed environments');
  console.log('2. Make sure NEXTAUTH_URL is set to the correct production URL (including https://)');
  console.log('3. Check if cookies are being properly set (secure flag, domain, etc.)');
  console.log('4. Clear browser cookies and cache before testing again');
  console.log('5. Try in a private/incognito window or different browser');
  console.log('6. Check browser console for any errors during login attempt');
  console.log('7. Verify your server logs for any backend errors during login');
}

runAllChecks()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); 