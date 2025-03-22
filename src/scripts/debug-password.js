/**
 * Debug Password Verification
 * Tests direct password verification with the database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

// Credentials to test
const EMAIL = 'sarafpriyanshu09@gmail.com';
const PASSWORD = 'matchupsports';

async function resetPassword() {
  console.log('\n🔑 RESETTING PASSWORD FOR DEBUG');
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
    });
    
    if (!user) {
      console.log(`❌ User with email ${EMAIL} not found`);
      return;
    }
    
    console.log(`✅ Found user: ID ${user.id}, Email: ${user.email}`);
    
    // Generate a new hash for the same password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(PASSWORD, salt);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email: EMAIL },
      data: { password: hashedPassword },
      select: { id: true, email: true }
    });
    
    console.log(`✅ Password reset for user: ${updatedUser.email}`);
    console.log(`   New password hash: ${hashedPassword.substring(0, 10)}...`);
    
    return updatedUser;
  } catch (error) {
    console.log(`❌ Error resetting password: ${error.message}`);
  }
}

async function verifyPasswordManually() {
  console.log('\n🔍 MANUAL PASSWORD VERIFICATION');
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { id: true, email: true, password: true }
    });
    
    if (!user || !user.password) {
      console.log(`❌ User with email ${EMAIL} not found or has no password`);
      return;
    }
    
    console.log(`✅ Found user password hash: ${user.password.substring(0, 10)}...`);
    
    // Try different password formats
    const passwordsToTest = [
      PASSWORD,
      PASSWORD.trim(),
      PASSWORD + ' ',  // with trailing space
      ' ' + PASSWORD,  // with leading space
      PASSWORD.toLowerCase(),
      PASSWORD.toUpperCase()
    ];
    
    console.log(`Testing ${passwordsToTest.length} password variations:`);
    
    for (let i = 0; i < passwordsToTest.length; i++) {
      const testPassword = passwordsToTest[i];
      const isValid = await bcrypt.compare(testPassword, user.password);
      
      console.log(`${i+1}. "${testPassword}": ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
  } catch (error) {
    console.log(`❌ Error verifying password: ${error.message}`);
  }
}

// Create a fake JWT token with the same secret to test
async function testJwtToken() {
  console.log('\n🔒 TESTING JWT TOKEN CREATION');
  
  const jwt = require('jsonwebtoken');
  
  try {
    // Create a test payload
    const payload = {
      email: EMAIL,
      sub: '1',  // Use a fake user ID
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60  // 1 hour from now
    };
    
    // JWT secret
    const secret = process.env.NEXTAUTH_SECRET;
    
    if (!secret) {
      console.log('❌ NEXTAUTH_SECRET not found in environment variables');
      return;
    }
    
    console.log(`Using NEXTAUTH_SECRET: ***${secret.slice(-4)}`);
    
    // Sign a test token
    const token = jwt.sign(payload, secret);
    console.log(`✅ Created test token: ${token.substring(0, 20)}...`);
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, secret);
      console.log(`✅ Token verification successful`);
      console.log(`   Decoded payload: ${JSON.stringify(decoded)}`);
    } catch (verifyError) {
      console.log(`❌ Token verification failed: ${verifyError.message}`);
    }
  } catch (error) {
    console.log(`❌ Error creating JWT token: ${error.message}`);
  }
}

async function checkUserStatus() {
  console.log('\n👤 CHECKING USER STATUS');
  
  try {
    // Find user by email with full details
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
      select: { 
        id: true, 
        email: true, 
        username: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      console.log(`❌ User with email ${EMAIL} not found`);
      return;
    }
    
    console.log(`✅ User details:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username || '[not set]'}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Last Updated: ${user.updatedAt}`);
    
    // Check if status is active
    if (user.status !== 'ACTIVE') {
      console.log(`❌ User account is not active (status: ${user.status})`);
      
      // Activate the user if needed
      const updatedUser = await prisma.user.update({
        where: { email: EMAIL },
        data: { status: 'ACTIVE' },
        select: { id: true, email: true, status: true }
      });
      
      console.log(`✅ User status updated to: ${updatedUser.status}`);
    } else {
      console.log(`✅ User account is active`);
    }
  } catch (error) {
    console.log(`❌ Error checking user status: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 PASSWORD VERIFICATION DEBUG');
  console.log('=============================');
  
  try {
    // Check user status first
    await checkUserStatus();
    
    // Verify current password
    await verifyPasswordManually();
    
    // Reset password if needed (uncomment to use)
    const resetConfirm = process.argv.includes('--reset');
    if (resetConfirm) {
      await resetPassword();
      // Verify again after reset
      await verifyPasswordManually();
    } else {
      console.log('\n⚠️ Password reset not requested. Run with --reset to reset password.');
    }
    
    // Test JWT token creation
    await testJwtToken();
    
    // Provide recommendations
    console.log('\n🔧 RECOMMENDATIONS');
    if (resetConfirm) {
      console.log('1. Password has been reset - try logging in with the new password');
    } else {
      console.log('1. If password verification is failing, run this script with --reset to reset the password');
    }
    console.log('2. Make sure the NEXTAUTH_SECRET is identical in your deployment and .env file');
    console.log('3. Clear browser cookies and try in an incognito window');
    console.log('4. Check that you are using the correct email and password combination');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 