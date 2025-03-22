/**
 * This script tests authentication with the updated NEXTAUTH_SECRET
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  // Print environment variables (redacting sensitive values)
  console.log('ENVIRONMENT VARIABLES:');
  console.log(`- NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '****' + process.env.NEXTAUTH_SECRET.slice(-4) : 'not set'}`);
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '****' + process.env.DATABASE_URL.slice(-20) : 'not set'}`);
  console.log(`- NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'sarafpriyanshu09@gmail.com' },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
        name: true
      }
    });
    
    if (!user) {
      console.error('User not found in database');
      return;
    }
    
    console.log('\nUSER INFORMATION:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Status: ${user.status}`);
    
    // Verify password
    const password = 'matchupsports';
    const passwordMatches = await bcrypt.compare(password, user.password);
    console.log(`- Password matches: ${passwordMatches ? 'Yes ✅' : 'No ❌'}`);
    
    // Create a JWT token as NextAuth would
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('\nJWT TOKEN:');
    console.log(`- Token (truncated): ${token.substring(0, 20)}...`);
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      console.log('\nDECODED TOKEN:');
      console.log(`- ID: ${decoded.id}`);
      console.log(`- Email: ${decoded.email}`);
      console.log(`- Role: ${decoded.role}`);
      console.log(`- JWT verification: Success ✅`);
    } catch (error) {
      console.error('\nJWT VERIFICATION ERROR:');
      console.error(`- Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error in test-auth script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth()
  .then(() => {
    console.log('\nAuthentication test completed');
  })
  .catch(error => {
    console.error('Authentication test failed:', error);
    process.exit(1);
  }); 