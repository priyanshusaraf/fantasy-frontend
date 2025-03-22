/**
 * This script resets a user's password
 * Run with: node -r dotenv/config src/scripts/reset-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Initialize Prisma client
const prisma = new PrismaClient();

async function resetPassword(email = 'sarafpriyanshu09@gmail.com', newPassword = 'matchupsports') {
  try {
    console.log(`Starting password reset for ${email}...`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.error(`User with email ${email} does not exist`);
      return null;
    }
    
    console.log(`User found: ${user.name || user.email} (ID: ${user.id})`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword 
      }
    });
    
    console.log(`Password has been reset successfully for ${email}`);
    console.log(`New password: ${newPassword}`);
    
    return user;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if this script is run directly
if (require.main === module) {
  // Allow email and password to be passed as environment variables
  const email = process.env.TARGET_EMAIL || 'sarafpriyanshu09@gmail.com';
  const password = process.env.NEW_PASSWORD || 'matchupsports';
  
  resetPassword(email, password)
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

module.exports = { resetPassword }; 