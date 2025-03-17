import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// Helper function to safely stringify objects with BigInt values
function safeStringify(obj: any) {
  return JSON.stringify(obj, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
}

// Helper function to map tournament types from form to schema
function mapTournamentType(formType: string): 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES' | 'ROUND_ROBIN' | 'KNOCKOUT' | 'LEAGUE' {
  // Map the form values to the actual Prisma enum values
  switch(formType) {
    case 'MIXED':
      return 'MIXED_DOUBLES';
    case 'SINGLES':
      return 'SINGLES';
    case 'DOUBLES':
      return 'DOUBLES';
    default:
      // Default to SINGLES if the type is unknown
      return 'SINGLES';
  }
}

// This is a special endpoint that bypasses normal authentication
// It should only be used in development for testing
export async function POST(request: NextRequest) {
  console.log("Tournament direct creation endpoint called");
  
  try {
    const body = await request.json();
    const { tournamentData, userEmail, secretKey } = body;
    
    // Security check
    if (secretKey !== "tournament-direct-creation") {
      console.log("Invalid secret key provided");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log("Processing tournament creation request for:", tournamentData.name);
    
    // Find the user who is creating the tournament
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log("User not found:", userEmail);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log("User found:", user.id);
    
    // Check if the user already has a tournament admin record
    let tournamentAdmin = await prisma.tournamentAdmin.findUnique({
      where: { userId: user.id }
    });
    
    // If not, create a new tournament admin
    if (!tournamentAdmin) {
      console.log("Creating new TournamentAdmin for user:", user.id);
      tournamentAdmin = await prisma.tournamentAdmin.create({
        data: { userId: user.id }
      });
    } else {
      console.log("Using existing TournamentAdmin:", tournamentAdmin.id);
      
      // Count existing tournaments for this admin using a simple raw query
      const countQuery = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Tournament WHERE organizerId = ${tournamentAdmin.id}
      `;
      // Convert BigInt values to regular numbers before stringifying
      console.log("Existing tournaments for this admin:", safeStringify(countQuery));
    }

    // Create the tournament without the problematic fields first
    const tournament = await prisma.tournament.create({
      data: {
        name: tournamentData.name,
        description: tournamentData.description || "",
        location: tournamentData.location || "",
        startDate: new Date(tournamentData.startDate),
        endDate: new Date(tournamentData.endDate),
        registrationOpenDate: new Date(tournamentData.registrationOpenDate || tournamentData.startDate),
        registrationCloseDate: new Date(tournamentData.registrationCloseDate || tournamentData.startDate),
        type: mapTournamentType(tournamentData.type || "SINGLES"),
        maxParticipants: tournamentData.maxParticipants || 32,
        entryFee: tournamentData.entryFee || 0,
        status: "DRAFT",
        fantasySettings: JSON.stringify({
          enableFantasy: tournamentData.settings?.enableFantasy || false,
          enableLiveScoring: tournamentData.settings?.enableLiveScoring || false,
          fantasyFormat: "STANDARD",
          formatType: tournamentData.settings?.formatType || "KNOCKOUT"
        }),
        organizerId: tournamentAdmin.id  // Use the existing or newly created tournamentAdmin
      },
    });
    
    console.log("Tournament created successfully with ID:", tournament.id);
    
    // Verify tournament was created successfully
    const verifyTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id }
    });
    
    if (!verifyTournament) {
      throw new Error(`Failed to verify tournament creation for ID: ${tournament.id}`);
    }
    
    console.log("Tournament verification successful!");
    
    // Now update the isTeamBased field using executeRaw to bypass type checking
    await prisma.$executeRaw`
      UPDATE Tournament 
      SET isTeamBased = ${tournamentData.isTeamBased ? 1 : 0}
      WHERE id = ${tournament.id}
    `;

    console.log("Tournament updated with isTeamBased:", !!tournamentData.isTeamBased);

    // Process teams and players based on whether it's team-based
    if (tournamentData.isTeamBased) {
      console.log("Processing team-based tournament with teams:", tournamentData.teams?.length || 0);
      
      // Create teams and assign players
      if (tournamentData.teams && tournamentData.teams.length > 0) {
        for (const teamData of tournamentData.teams) {
          console.log("Creating team:", teamData.name);
          
          // Create team using executeRaw to bypass type checking
          await prisma.$executeRaw`
            INSERT INTO Team (name, tournamentId, createdAt, updatedAt)
            VALUES (${teamData.name}, ${tournament.id}, NOW(), NOW())
          `;
          
          // Get the last inserted team ID
          const teamIdResult = await prisma.$queryRaw`SELECT LAST_INSERT_ID() as id`;
          console.log("Team ID result:", safeStringify(teamIdResult));
          // Convert BigInt to Number if needed
          const teamId = Number((teamIdResult as any)[0].id);
          
          console.log("Team created:", teamId);
          
          // Process players for this team
          if (teamData.players && teamData.players.length > 0) {
            const processedPlayerIds = new Set<number>();
            
            for (const playerData of teamData.players) {
              // Skip duplicates within the same team
              if (playerData.id && processedPlayerIds.has(playerData.id)) {
                console.log(`Skipping duplicate player ID ${playerData.id} in team ${teamId}`);
                continue;
              }
              
              try {
                let player;
                
                // Check if player already exists (has an ID)
                if (playerData.id) {
                  player = await prisma.player.findUnique({
                    where: { id: playerData.id }
                  });
                  
                  if (!player) {
                    console.log(`Player with ID ${playerData.id} not found, creating new`);
                    player = await prisma.player.create({
                      data: {
                        name: playerData.name,
                        skillLevel: (playerData.skillLevel as any) || "INTERMEDIATE",
                        country: playerData.country || null
                      }
                    });
                  } else {
                    console.log(`Found existing player: ${player.id} - ${player.name}`);
                  }
                } else {
                  // Create new player if no ID
                  console.log(`Creating new player: ${playerData.name}`);
                  
                  // Use executeRaw for player creation
                  await prisma.$executeRaw`
                    INSERT INTO Player (name, skillLevel, country, createdAt, updatedAt, isActive)
                    VALUES (${playerData.name}, ${playerData.skillLevel || "INTERMEDIATE"}, ${playerData.country || null}, NOW(), NOW(), 1)
                  `;
                  
                  // Get the last inserted player ID
                  const playerIdResult = await prisma.$queryRaw`SELECT LAST_INSERT_ID() as id`;
                  console.log("Player ID result:", safeStringify(playerIdResult));
                  // Convert BigInt to Number if needed
                  player = {
                    id: Number((playerIdResult as any)[0].id),
                    name: playerData.name
                  };
                }
                
                // Add player to the processed set
                if (player.id) {
                  processedPlayerIds.add(player.id);
                }
                
                // Connect player to team
                await prisma.$executeRaw`
                  INSERT INTO _PlayerToTeam (A, B)
                  VALUES (${player.id}, ${teamId})
                `;
                
                // Create tournament entry for this player
                const existingEntry = await prisma.tournamentEntry.findFirst({
                  where: {
                    tournamentId: tournament.id,
                    playerId: player.id
                  }
                });
                
                if (!existingEntry) {
                  await prisma.$executeRaw`
                    INSERT INTO TournamentEntry (tournamentId, playerId, registeredAt, paymentStatus)
                    VALUES (${tournament.id}, ${player.id}, NOW(), 'PENDING')
                  `;
                  console.log(`Created tournament entry for player ${player.id}`);
                } else {
                  console.log(`Tournament entry already exists for player ${player.id}`);
                }
              } catch (error) {
                console.error(`Error processing player ${playerData.name}:`, error);
                // Continue processing other players
              }
            }
          }
        }
      }
    } else {
      // For individual player tournaments
      console.log("Processing individual player tournament");
      if (tournamentData.players && tournamentData.players.length > 0) {
        const processedPlayerIds = new Set<number>();
        
        for (const playerData of tournamentData.players) {
          // Skip duplicates
          if (playerData.id && processedPlayerIds.has(playerData.id)) {
            console.log(`Skipping duplicate player ID ${playerData.id}`);
            continue;
          }
          
          try {
            let player;
            
            // Check if player already exists
            if (playerData.id) {
              player = await prisma.player.findUnique({
                where: { id: playerData.id }
              });
              
              if (!player) {
                console.log(`Player with ID ${playerData.id} not found, creating new`);
                
                // Use executeRaw for player creation
                await prisma.$executeRaw`
                  INSERT INTO Player (name, skillLevel, country, createdAt, updatedAt, isActive)
                  VALUES (${playerData.name}, ${playerData.skillLevel || "INTERMEDIATE"}, ${playerData.country || null}, NOW(), NOW(), 1)
                `;
                
                // Get the last inserted player ID
                const playerIdResult = await prisma.$queryRaw`SELECT LAST_INSERT_ID() as id`;
                console.log("Player ID result:", safeStringify(playerIdResult));
                // Convert BigInt to Number if needed
                player = {
                  id: Number((playerIdResult as any)[0].id),
                  name: playerData.name
                };
              } else {
                console.log(`Found existing player: ${player.id} - ${player.name}`);
              }
            } else {
              // Create new player
              console.log(`Creating new player: ${playerData.name}`);
              player = await prisma.player.create({
                data: {
                  name: playerData.name,
                  skillLevel: (playerData.skillLevel as any) || "INTERMEDIATE",
                  country: playerData.country || null
                }
              });
            }
            
            // Add player to the processed set
            if (player.id) {
              processedPlayerIds.add(player.id);
            }
            
            // Create tournament entry
            const existingEntry = await prisma.tournamentEntry.findFirst({
              where: {
                tournamentId: tournament.id,
                playerId: player.id
              }
            });
            
            if (!existingEntry) {
              await prisma.$executeRaw`
                INSERT INTO TournamentEntry (tournamentId, playerId, registeredAt, paymentStatus)
                VALUES (${tournament.id}, ${player.id}, NOW(), 'PENDING')
              `;
              console.log(`Created tournament entry for player ${player.id}`);
            } else {
              console.log(`Tournament entry already exists for player ${player.id}`);
            }
          } catch (error) {
            console.error(`Error processing player ${playerData.name}:`, error);
            // Continue processing other players
          }
        }
      }
    }

    console.log("Tournament creation completed successfully");
    return NextResponse.json({ 
      message: "Tournament created successfully", 
      tournamentId: tournament.id,
      redirectUrl: `/admin/tournaments/${tournament.id}`
    });
  } catch (error) {
    console.error("Error creating tournament:", error);
    
    // Provide more context in the error response
    let errorMessage = "Failed to create tournament";
    if (error instanceof Error) {
      // Check if this is a BigInt serialization error
      if (error.message.includes("serialize a BigInt")) {
        errorMessage = "BigInt serialization error - please check database query results";
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        message: "Failed to create tournament", 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 