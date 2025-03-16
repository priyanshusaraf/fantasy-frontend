/**
 * Script to migrate fantasy settings from the tournament.rules field to the new fantasySettings field
 * 
 * Run with: npx ts-node src/scripts/migrate-fantasy-settings.ts
 */

const { PrismaClient } = require('@prisma/client')

// Initialize Prisma client
const prisma = new PrismaClient()

async function migrateFancySettings() {
  console.log('Starting migration of fantasy settings...')
  
  try {
    // Get all tournaments
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        rules: true,
        fantasySettings: true
      }
    })
    
    console.log(`Found ${tournaments.length} tournaments to process`)
    
    let migratedCount = 0
    
    // Process each tournament
    for (const tournament of tournaments) {
      if (!tournament.rules) {
        console.log(`Tournament ${tournament.id} (${tournament.name}) has no rules, skipping`)
        continue
      }
      
      if (tournament.fantasySettings) {
        console.log(`Tournament ${tournament.id} (${tournament.name}) already has fantasySettings, skipping`)
        continue
      }
      
      try {
        // Try to parse the rules field as JSON
        const parsedRules = JSON.parse(tournament.rules)
        
        // Check if rules contain fantasy settings
        if (parsedRules.enableFantasy !== undefined || 
            parsedRules.contests !== undefined || 
            parsedRules.fantasyPoints !== undefined) {
          
          // Extract fantasy-related settings
          const fantasySettings = {
            enableFantasy: parsedRules.enableFantasy || false,
            fantasyPoints: parsedRules.fantasyPoints || 'STANDARD',
            autoPublish: parsedRules.autoPublish || true,
            customPoints: parsedRules.customPoints || null,
          }
          
          // Update the tournament with the new fantasySettings field
          await prisma.tournament.update({
            where: { id: tournament.id },
            data: {
              fantasySettings: JSON.stringify(fantasySettings)
            }
          })
          
          console.log(`Migrated fantasy settings for tournament ${tournament.id} (${tournament.name})`)
          migratedCount++
        } else {
          console.log(`Tournament ${tournament.id} (${tournament.name}) has rules but no fantasy settings`)
        }
      } catch (error) {
        console.error(`Error processing tournament ${tournament.id} (${tournament.name}):`, error)
      }
    }
    
    console.log(`Migration complete! Migrated ${migratedCount} tournaments.`)
  } catch (error) {
    console.error('Error during migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateFancySettings().catch(e => {
  console.error('Error in migration script:', e)
  process.exit(1)
}) 