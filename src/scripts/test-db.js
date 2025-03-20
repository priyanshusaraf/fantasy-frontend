// Test script to verify database connectivity
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to connect to the database...');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@")}`);
    
    await prisma.$connect();
    console.log('Successfully connected to the database!');
    
    // Try to run a simple query
    const userCount = await prisma.user.count();
    console.log(`Database contains ${userCount} users`);
    
    await prisma.$disconnect();
    console.log('Connection closed successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to connect to the database:');
    console.error(error);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nThe database server is refusing connections. Possible causes:');
      console.error('- The database server is not running');
      console.error('- Firewall is blocking the connection');
      console.error('- The database URL is incorrect');
      console.error('- You\'re connecting from an IP that\'s not allowed by the database security group');
    }
    
    if (error.message.includes('Access denied')) {
      console.error('\nAccess was denied. Possible causes:');
      console.error('- Incorrect username or password');
      console.error('- The user doesn\'t have permission to access this database');
    }
    
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(success => {
      console.log(success ? 'Test completed successfully' : 'Test failed');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection }; 