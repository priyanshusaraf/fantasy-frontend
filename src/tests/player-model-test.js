const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPlayerModel() {
  console.log('Starting player model test...');

  try {
    // 1. Create a test player with the new skill level and gender fields
    const player = await prisma.player.create({
      data: {
        name: 'Test Player',
        country: 'USA',
        skillLevel: 'B_PLUS', // Using the enum value (B_PLUS maps to "B+")
        age: 28,
        gender: 'MALE',
        isActive: true,
      }
    });

    console.log('Created test player:', player);

    // 2. Retrieve the player to verify all fields are stored correctly
    const retrievedPlayer = await prisma.player.findUnique({
      where: { id: player.id }
    });

    console.log('Retrieved player:', retrievedPlayer);

    // 3. Clean up (delete the test player)
    await prisma.player.delete({
      where: { id: player.id }
    });

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPlayerModel(); 