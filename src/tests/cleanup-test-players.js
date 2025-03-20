const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestPlayers() {
  try {
    console.log('Cleaning up test players...');
    
    // Delete all players (since these are all test data)
    const deleted = await prisma.player.deleteMany({});
    
    console.log(`Deleted ${deleted.count} players`);
    
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestPlayers(); 