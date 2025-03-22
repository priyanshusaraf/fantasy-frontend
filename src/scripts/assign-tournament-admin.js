/**
 * This script assigns Tournament Admin role to an existing user by email
 * Run with: node -r dotenv/config src/scripts/assign-tournament-admin.js
 */

const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

async function assignTournamentAdmin(targetEmail = 'sarafpriyanshu09@gmail.com') {
  try {
    console.log(`Starting to assign Tournament Admin role to ${targetEmail}...`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        tournamentAdmin: true
      }
    });
    
    if (!user) {
      console.error(`User with email ${targetEmail} does not exist`);
      return null;
    }
    
    console.log(`User found: ${user.name || user.email} (ID: ${user.id})`);
    
    // Check if user already has tournament admin role
    if (user.role === 'TOURNAMENT_ADMIN') {
      console.log(`User already has TOURNAMENT_ADMIN role`);
    } else {
      // Update user role to TOURNAMENT_ADMIN
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'TOURNAMENT_ADMIN' }
      });
      console.log(`Updated user role to TOURNAMENT_ADMIN`);
    }
    
    // Check if user already has tournamentAdmin record
    if (user.tournamentAdmin) {
      console.log(`User already has TournamentAdmin record`);
    } else {
      // Create TournamentAdmin record
      await prisma.tournamentAdmin.create({
        data: { userId: user.id }
      });
      console.log(`Created TournamentAdmin record for user`);
    }
    
    // Verify the changes
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        tournamentAdmin: true
      }
    });
    
    console.log(`Role assignment complete. Current status:`);
    console.log(`- User role: ${updatedUser.role}`);
    console.log(`- Has TournamentAdmin record: ${updatedUser.tournamentAdmin ? 'Yes' : 'No'}`);
    
    return updatedUser;
  } catch (error) {
    console.error('Error assigning Tournament Admin role:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this script is run directly
if (require.main === module) {
  const targetEmail = process.env.TARGET_EMAIL || 'sarafpriyanshu09@gmail.com';
  
  assignTournamentAdmin(targetEmail)
    .then(user => {
      if (user) {
        console.log('Script completed successfully');
      } else {
        console.log('Script failed - user not found');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { assignTournamentAdmin }; 