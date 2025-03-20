import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`Fetching tournament with ID: ${id}`);

    // Fetch tournament from database with properly matched field names
    const tournament = await prisma.tournament.findUnique({
      where: { id: parseInt(id) },
      include: {
        tournamentAdmin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
        entries: true,
        matches: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
        fantasyContests: {
          take: 5,
          orderBy: { id: 'asc' }, 
        }
      },
    });

    if (!tournament) {
      console.log(`Tournament with ID ${id} not found`);
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    console.log(`Successfully fetched tournament: ${tournament.name}`);
    return NextResponse.json(tournament);
  } catch (error) {
    console.error(`Error fetching tournament:`, error);
    return NextResponse.json(
      { message: "Error fetching tournament", error: String(error) },
      { status: 500 }
    );
  }
}

// Update an existing tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Updating tournament with ID: ${id}`);
    
    // Parse the request body
    const data = await request.json();
    const { tournamentData, userEmail, secretKey } = data;
    
    // Verify the secret key
    if (secretKey !== "tournament-direct-update") {
      console.log("Invalid secret key for tournament update");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Check if tournament exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!existingTournament) {
      console.log(`Tournament with ID ${id} not found for update`);
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }
    
    // Get the user making the update
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        tournamentAdmin: true
      }
    });
    
    if (!user) {
      console.log(`User with email ${userEmail} not found for tournament update`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Prepare fantasy settings
    const fantasySettings = JSON.stringify({
      enableFantasy: tournamentData.settings?.enableFantasy || false,
      enableLiveScoring: tournamentData.settings?.enableLiveScoring || false,
      fantasyFormat: "STANDARD"
    });
    
    // Update the tournament
    const updatedTournament = await prisma.tournament.update({
      where: { id: parseInt(id) },
      data: {
        name: tournamentData.name,
        description: tournamentData.description || "",
        location: tournamentData.location,
        startDate: new Date(tournamentData.startDate),
        endDate: new Date(tournamentData.endDate),
        registrationOpenDate: new Date(tournamentData.registrationOpenDate),
        registrationCloseDate: new Date(tournamentData.registrationCloseDate),
        maxParticipants: tournamentData.maxParticipants || 32,
        entryFee: tournamentData.entryFee || 0,
        type: tournamentData.type,
        isTeamBased: tournamentData.isTeamBased,
        fantasySettings,
      },
    });
    
    console.log(`Tournament updated successfully: ${updatedTournament.id}`);
    
    // Update teams if it's team-based
    if (tournamentData.isTeamBased && tournamentData.teams && tournamentData.teams.length > 0) {
      // First, get existing teams to determine what to update/create/remove
      const existingTeams = await prisma.team.findMany({
        where: { tournamentId: parseInt(id) },
        include: { players: true }
      });
      
      console.log(`Found ${existingTeams.length} existing teams, updating with ${tournamentData.teams.length} new teams`);
      
      // Process each team from the form
      for (const team of tournamentData.teams) {
        // Check if this team already exists (by ID or name)
        const existingTeam = team.id ? 
          existingTeams.find(t => t.id === team.id) : 
          existingTeams.find(t => t.name === team.name);
        
        if (existingTeam) {
          // Update existing team
          console.log(`Updating existing team: ${existingTeam.id} - ${team.name}`);
          
          await prisma.team.update({
            where: { id: existingTeam.id },
            data: { name: team.name }
          });
          
          // Update team players
          if (team.players && team.players.length > 0) {
            // Process players
            for (const playerData of team.players) {
              // Check if player exists in the system
              let player = await prisma.player.findFirst({
                where: { name: playerData.name }
              });
              
              if (!player) {
                // Create player if doesn't exist
                player = await prisma.player.create({
                  data: {
                    name: playerData.name,
                    skillLevel: playerData.skillLevel as any || "INTERMEDIATE",
                    country: playerData.country || null
                  }
                });
                console.log(`Created new player: ${player.id} - ${player.name}`);
              }
              
              // Check if player is already in this team's tournament entry
              const existingEntry = await prisma.tournamentEntry.findFirst({
                where: {
                  tournamentId: parseInt(id),
                  playerId: player.id,
                }
              });
              
              if (!existingEntry) {
                // Create tournament entry for the player
                await prisma.tournamentEntry.create({
                  data: {
                    tournamentId: parseInt(id),
                    playerId: player.id,
                  }
                });
                
                console.log(`Added player ${player.id} to tournament ${id}`);
              }
              
              // Make sure player is added to this team
              const existingTeamPlayer = await prisma.player.findFirst({
                where: {
                  id: player.id,
                  teamMemberships: {
                    some: {
                      id: existingTeam.id
                    }
                  }
                }
              });
              
              if (!existingTeamPlayer) {
                // Add player to team
                await prisma.team.update({
                  where: { id: existingTeam.id },
                  data: {
                    players: {
                      connect: { id: player.id }
                    }
                  }
                });
                console.log(`Connected player ${player.id} to team ${existingTeam.id}`);
              }
            }
          }
        } else {
          // Create new team
          console.log(`Creating new team: ${team.name}`);
          
          const newTeam = await prisma.team.create({
            data: {
              name: team.name,
              tournament: {
                connect: { id: parseInt(id) }
              }
            }
          });
          
          // Add players to new team
          if (team.players && team.players.length > 0) {
            for (const playerData of team.players) {
              // Find or create player
              let player = await prisma.player.findFirst({
                where: { name: playerData.name }
              });
              
              if (!player) {
                player = await prisma.player.create({
                  data: {
                    name: playerData.name,
                    skillLevel: playerData.skillLevel as any || "INTERMEDIATE",
                    country: playerData.country || null
                  }
                });
                console.log(`Created player: ${player.id} - ${player.name}`);
              }
              
              // Create tournament entry
              await prisma.tournamentEntry.create({
                data: {
                  tournamentId: parseInt(id),
                  playerId: player.id,
                }
              });
              
              // Add player to team
              await prisma.team.update({
                where: { id: newTeam.id },
                data: {
                  players: {
                    connect: { id: player.id }
                  }
                }
              });
              
              console.log(`Added player ${player.id} to new team ${newTeam.id}`);
            }
          }
        }
      }
    } 
    // Handle individual players (non-team based)
    else if (!tournamentData.isTeamBased && tournamentData.players && tournamentData.players.length > 0) {
      // Get existing entries
      const existingEntries = await prisma.tournamentEntry.findMany({
        where: { tournamentId: parseInt(id) },
        include: { player: true }
      });
      
      console.log(`Found ${existingEntries.length} existing players, updating with ${tournamentData.players.length} new players`);
      
      // Process each player
      for (const playerData of tournamentData.players) {
        // Check if this player already exists
        let player = await prisma.player.findFirst({
          where: { 
            OR: [
              { id: playerData.id },
              { name: playerData.name }
            ]
          }
        });
        
        if (!player) {
          // Create player if doesn't exist
          player = await prisma.player.create({
            data: {
              name: playerData.name,
              skillLevel: playerData.skillLevel as any || "INTERMEDIATE",
              country: playerData.country || null
            }
          });
          console.log(`Created new player: ${player.id} - ${player.name}`);
        }
        
        // Check if player is already in tournament
        const existingEntry = existingEntries.find(entry => entry.playerId === player?.id);
        
        if (!existingEntry) {
          // Create tournament entry
          await prisma.tournamentEntry.create({
            data: {
              tournamentId: parseInt(id),
              playerId: player.id,
            }
          });
          console.log(`Added player ${player.id} to tournament ${id}`);
        }
      }
    }
    
    return NextResponse.json(updatedTournament, { status: 200 });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament", details: String(error) },
      { status: 500 }
    );
  }
}

// Update tournament status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Always set status to IN_PROGRESS regardless of requested status
    // This simplifies the system as per requirements
    
    // Update tournament status
    const updatedTournament = await prisma.tournament.update({
      where: { id: parseInt(id) },
      data: { status: "IN_PROGRESS" }
    });
    
    return NextResponse.json(updatedTournament);
  } catch (error) {
    console.error("Error updating tournament status:", error);
    return NextResponse.json(
      { error: "Failed to update tournament status" },
      { status: 500 }
    );
  }
} 