/**
 * This script creates a Tournament Admin user directly in the database
 * Run with: node -r dotenv/config src/scripts/create-tournament-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize Prisma client
const prisma = new PrismaClient();

async function createTournamentAdmin() {
  try {
    console.log('Starting Tournament Admin creation...');
    
    // Define admin user data
    const adminData = {
      username: 'tournamentadmin',
      email: 'tournamentadmin@example.com',
      password: 'Password123!', // Will be hashed before storing
      name: 'Tournament Admin',
      role: 'TOURNAMENT_ADMIN',
    };
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });
    
    if (existingUser) {
      console.log(`User with email ${adminData.email} already exists`);
      
      // Check if user has tournament admin role record
      const hasTournamentAdmin = await prisma.tournamentAdmin.findUnique({
        where: { userId: existingUser.id },
      });
      
      if (hasTournamentAdmin) {
        console.log('User already has TournamentAdmin record');
      } else {
        console.log('Creating TournamentAdmin record for existing user...');
        await prisma.tournamentAdmin.create({
          data: { userId: existingUser.id }
        });
        console.log('TournamentAdmin record created successfully');
      }
      
      return existingUser;
    }
    
    // Create user in a transaction
    console.log('Creating new Tournament Admin user...');
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          username: adminData.username,
          email: adminData.email,
          name: adminData.name,
          password: hashedPassword,
          role: adminData.role,
          status: 'ACTIVE',
        },
      });
      
      // Create account
      await tx.account.create({
        data: {
          userId: user.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: adminData.email,
        }
      });
      
      // Create tournamentAdmin record
      await tx.tournamentAdmin.create({
        data: { userId: user.id }
      });
      
      // Create wallet
      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        }
      });
      
      return user;
    });
    
    console.log(`Tournament Admin created successfully with ID: ${newUser.id}`);
    return newUser;
    
  } catch (error) {
    console.error('Error creating Tournament Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this script is run directly
if (require.main === module) {
  createTournamentAdmin()
    .then(user => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTournamentAdmin }; 