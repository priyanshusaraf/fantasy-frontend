const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Starting auth diagnostic script');
  
  try {
    // 1. Test database connection
    console.log('\n📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // 2. Check if user exists (test with your email)
    const testEmail = process.argv[2] || 'test@example.com';
    console.log(`\n🔎 Looking for user with email: ${testEmail}`);
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    if (!user) {
      console.log(`❌ No user found with email: ${testEmail}`);
      console.log('\nTry creating a test user:');
      
      // Create test password hash for demonstration
      const hashedPassword = await bcrypt.hash('password123', 10);
      console.log(`Hashed password: ${hashedPassword}`);
      console.log(`
      // Create a user with this command:
      prisma.user.create({
        data: {
          name: "Test User",
          email: "${testEmail}",
          password: "${hashedPassword}",
          role: "USER",
          status: "ACTIVE"
        }
      })
      `);
      
      // Exit early
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ User found');
    console.log(`User ID: ${user.id}`);
    console.log(`Username: ${user.username || 'N/A'}`);
    console.log(`Name: ${user.name || 'N/A'}`);
    console.log(`Role: ${user.role || 'USER'}`);
    console.log(`Status: ${user.status || 'N/A'}`);
    
    // 3. Test password verification
    if (!user.password) {
      console.log('❌ User has no password set');
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n🔐 Testing password verification');
    console.log('Password hash in DB:', user.password);
    
    // Test with a known password if provided as third argument
    const testPassword = process.argv[3] || 'password123';
    console.log(`Testing password: ${testPassword}`);
    
    const passwordMatch = await bcrypt.compare(testPassword, user.password);
    if (passwordMatch) {
      console.log('✅ Password verified successfully!');
    } else {
      console.log('❌ Password verification failed');
      
      // Check bcrypt format
      if (!user.password.startsWith('$')) {
        console.log('❓ Password hash does not appear to be a valid bcrypt hash');
      }
      
      // Create a new hash for comparison
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`Sample bcrypt hash for '${testPassword}': ${newHash}`);
    }
    
    // 4. Verify user login query
    console.log('\n🧪 Testing login query...');
    const foundUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        password: true,
        role: true,
        status: true
      }
    });
    
    if (foundUser) {
      console.log('✅ Login query successful');
      // Test isActive check in your auth code
      const isActive = foundUser.status === 'ACTIVE';
      console.log(`User active status: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
    } else {
      console.log('❌ Login query failed');
    }
    
  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🏁 Diagnostic complete');
  }
}

main(); 