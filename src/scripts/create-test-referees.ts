import { PrismaClient, UserRole } from '@prisma/client';

async function createTestReferees() {
  console.log('Creating test referees...');
  
  const prisma = new PrismaClient();
  
  try {
    // Create test users
    const users = [
      { username: 'referee1', email: 'referee1@example.com', role: 'REFEREE' as UserRole },
      { username: 'referee2', email: 'referee2@example.com', role: 'REFEREE' as UserRole },
      { username: 'referee3', email: 'referee3@example.com', role: 'REFEREE' as UserRole },
    ];
    
    for (const userData of users) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      
      let user;
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating role...`);
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'REFEREE' as UserRole },
        });
      } else {
        console.log(`Creating new user ${userData.email}...`);
        user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            role: userData.role,
            password: 'password123', // Set a simple password for testing
          },
        });
      }
      
      // Check if referee profile exists
      const existingReferee = await prisma.referee.findUnique({
        where: { userId: user.id },
      });
      
      if (!existingReferee) {
        console.log(`Creating referee profile for ${userData.username}...`);
        await prisma.referee.create({
          data: {
            userId: user.id,
            certificationLevel: 'LEVEL_2',
          },
        });
      } else {
        console.log(`Referee profile for ${userData.username} already exists.`);
      }
    }
    
    console.log('Test referees created successfully!');
  } catch (error) {
    console.error('Error creating test referees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
createTestReferees();