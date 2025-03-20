const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testPlayerAPI = async () => {
  console.log('Starting player API direct test...');
  
  try {
    // Create multiple players with different skill levels
    const players = await Promise.all([
      prisma.player.create({
        data: {
          name: 'Alex Johnson',
          country: 'USA',
          skillLevel: 'A_PLUS',
          age: 28,
          gender: 'MALE',
          isActive: true,
        }
      }),
      prisma.player.create({
        data: {
          name: 'Maria Garcia',
          country: 'Spain',
          skillLevel: 'A',
          age: 32,
          gender: 'FEMALE',
          isActive: true,
        }
      }),
      prisma.player.create({
        data: {
          name: 'David Lee',
          country: 'Canada',
          skillLevel: 'B_PLUS',
          age: 25,
          gender: 'MALE',
          isActive: true,
        }
      }),
      prisma.player.create({
        data: {
          name: 'Sarah Kim',
          country: 'South Korea',
          skillLevel: 'B',
          age: 30,
          gender: 'FEMALE',
          isActive: true,
        }
      }),
      prisma.player.create({
        data: {
          name: 'James Wilson',
          country: 'UK',
          skillLevel: 'C',
          age: 35,
          gender: 'MALE',
          isActive: true,
        }
      })
    ]);
    
    console.log(`Created ${players.length} test players`);
    
    // Fetch all players to verify
    const allPlayers = await prisma.player.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('Fetched players:');
    allPlayers.forEach((player, index) => {
      console.log(`${index+1}. ${player.name} - Skill: ${player.skillLevel}, Age: ${player.age}, Gender: ${player.gender}`);
    });
    
    // Test querying players by skill level
    const bLevelPlayers = await prisma.player.findMany({
      where: {
        skillLevel: { in: ['B_PLUS', 'B', 'B_MINUS'] }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nB-level players (${bLevelPlayers.length}):`);
    bLevelPlayers.forEach((player, index) => {
      console.log(`${index+1}. ${player.name} - Skill: ${player.skillLevel}`);
    });
    
    // Test querying players by gender
    const femalePlayers = await prisma.player.findMany({
      where: { gender: 'FEMALE' },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nFemale players (${femalePlayers.length}):`);
    femalePlayers.forEach((player, index) => {
      console.log(`${index+1}. ${player.name}`);
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the test
testPlayerAPI(); 