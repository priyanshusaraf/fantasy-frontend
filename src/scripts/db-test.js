const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Create a new instance of PrismaClient
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Testing direct database connection...');
  
  try {
    // 1. Test database connection
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connection successful!');
    
    // 2. Count existing users
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    
    // 3. Create a test user if requested
    if (process.argv[2] === 'create-user') {
      // Generate a unique email
      const timestamp = Date.now();
      const testEmail = `test-user-${timestamp}@example.com`;
      const testPassword = 'Password123!';
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      console.log(`Creating test user with email: ${testEmail}`);
      
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          username: `test-user-${timestamp}`,
          name: `Test User ${timestamp}`,
          password: hashedPassword,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      
      console.log(`User created successfully with ID: ${newUser.id}`);
      console.log(`Email: ${newUser.email}`);
      console.log(`Password (plaintext): ${testPassword}`);
      
      // Try to find the user
      console.log('Verifying user creation...');
      const foundUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      
      if (foundUser) {
        console.log('User successfully retrieved from database!');
      } else {
        console.log('Error: User was not found after creation!');
      }
      
      // Test login
      console.log('Testing login with created user...');
      const correctPasswordMatch = await bcrypt.compare(testPassword, foundUser.password);
      console.log(`Password verification: ${correctPasswordMatch ? 'Success' : 'Failed'}`);
    }
    
    // 4. List recent users
    console.log('\nRetrieving recent users:');
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    recentUsers.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Status: ${user.status}, Created: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error in database test:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Test completed');
  }
}

main()
  .catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
  }); 