import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/tournaments/[id]/players
 * Get all players in a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get the tournament entries (players)
    const tournamentEntries = await prisma.tournamentEntry.findMany({
      where: {
        tournamentId: tournamentId,
      },
      include: {
        player: {
          include: {
            teamMemberships: true
          }
        }
      },
    });

    // Format the players array with team information
    const players = tournamentEntries.map((entry) => {
      // Find team information if available
      const team = entry.player.teamMemberships.find(
        team => team.tournamentId === tournamentId
      );

      return {
        id: entry.player.id,
        name: entry.player.name,
        skillLevel: entry.player.skillLevel,
        gender: entry.player.dominantHand, // Using dominantHand as a placeholder for gender since it's not in the schema
        position: entry.player.bio?.substring(0, 50) || "Player", // Using bio substring as a placeholder for position
        email: null, // We don't expose email for privacy reasons
        phone: null, // We don't expose phone for privacy reasons
        teamId: team?.id || null,
        teamName: team?.name || null,
      };
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Error retrieving tournament players:", error);
    return NextResponse.json(
      { error: "Failed to retrieve tournament players" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournaments/[id]/players
 * Add a player to a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TEMPORARY: Skip authentication in development mode
    let user;
    if (process.env.NODE_ENV === 'development') {
      console.log("⚠️ DEVELOPMENT MODE: Bypassing auth for adding players to tournaments");
      // Mock user with admin privileges
      user = { role: "TOURNAMENT_ADMIN" };
    } else {
      // Check authentication and authorization
      const authResult = await authMiddleware(request);
      if (authResult.status !== 200) {
        return authResult;
      }
      const { user: authUser } = request as any;
      user = authUser;
      
      // Only admin, tournament_admin and master_admin can add players
      if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { message: "Not authorized to add players to tournaments" },
          { status: 403 }
        );
      }
    }

    // Extract the tournament ID properly
    const tournamentId = parseInt(params.id);
    
    if (isNaN(tournamentId)) {
      console.error("Invalid tournament ID:", params.id);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    console.log(`Adding players to tournament: ${tournamentId}`);

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get player data from request body
    const body = await request.json();
    
    // Handle both single player addition and multiple player addition
    const playerIds = body.playerIds || (body.playerId ? [body.playerId] : []);
    
    if (playerIds.length === 0) {
      return NextResponse.json(
        { message: "No players specified" },
        { status: 400 }
      );
    }

    console.log(`Adding ${playerIds.length} players to tournament ${tournamentId}: ${playerIds.join(', ')}`);

    // Check all players at once first to avoid multiple queries
    const existingEntries = await prisma.tournamentEntry.findMany({
      where: {
        tournamentId,
        playerId: {
          in: playerIds
        }
      }
    });

    const existingPlayerIds = new Set(existingEntries.map(entry => entry.playerId));

    // Create tournament entries for each player
    const results = await Promise.all(
      playerIds.map(async (playerId: number) => {
        try {
          // Skip if already in tournament
          if (existingPlayerIds.has(playerId)) {
            console.log(`Player ${playerId} already in tournament ${tournamentId}`);
            return { playerId, status: "already_added" };
          }

          // Check if player exists
          const player = await prisma.player.findUnique({
            where: { id: playerId }
          });

          if (!player) {
            console.log(`Player ${playerId} not found`);
            return { playerId, status: "error", message: "Player not found" };
          }

          // Add player to tournament
          const entry = await prisma.tournamentEntry.create({
            data: {
              tournamentId,
              playerId,
              paymentStatus: "PAID", // Assume admin-added players have paid
            },
          });

          console.log(`Added player ${playerId} to tournament ${tournamentId}`);
          return { playerId, status: "added", entryId: entry.id };
        } catch (error) {
          console.error(`Error adding player ${playerId} to tournament:`, error);
          // Still return a successful object, but with error status
          return { 
            playerId, 
            status: "error", 
            message: error instanceof Error ? error.message : "Unknown error" 
          };
        }
      })
    );

    // Summarize results
    const added = results.filter(r => r.status === "added").length;
    const existing = results.filter(r => r.status === "already_added").length;
    const errors = results.filter(r => r.status === "error").length;

    console.log(`Successfully added ${added} players, ${existing} already in tournament, ${errors} errors`);

    return NextResponse.json({ 
      results,
      summary: { added, existing, errors }
    });
  } catch (error) {
    console.error("Error in tournament player addition:", error);
    return NextResponse.json(
      { 
        message: "Internal Server Error", 
        details: error instanceof Error ? error.message : "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id]/players/[playerId]
 * Remove a player from a tournament
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TEMPORARY: Skip authentication in development mode
    let user;
    if (process.env.NODE_ENV === 'development') {
      console.log("⚠️ DEVELOPMENT MODE: Bypassing auth for removing players from tournaments");
      // Mock user with admin privileges
      user = { role: "TOURNAMENT_ADMIN" };
    } else {
      // Check authentication and authorization
      const authResult = await authMiddleware(request);
      if (authResult.status !== 200) {
        return authResult;
      }
      const { user: authUser } = request as any;
      user = authUser;
      
      // Only admin, tournament_admin and master_admin can remove players
      if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { message: "Not authorized to remove players from tournaments" },
          { status: 403 }
        );
      }
    }

    // Extract the tournament ID properly
    const tournamentId = parseInt(params.id);
    
    if (isNaN(tournamentId)) {
      console.error("Invalid tournament ID:", params.id);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Get player ID from URL or request body
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const playerIdFromPath = pathParts[pathParts.length - 1];
    
    let playerId: number;
    
    if (playerIdFromPath && playerIdFromPath !== 'players') {
      playerId = parseInt(playerIdFromPath);
    } else {
      const body = await request.json();
      playerId = body.playerId;
    }

    if (!playerId || isNaN(playerId)) {
      return NextResponse.json(
        { message: "Valid player ID is required" },
        { status: 400 }
      );
    }

    console.log(`Removing player ${playerId} from tournament ${tournamentId}`);

    // Remove player from tournament
    await prisma.tournamentEntry.delete({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
    });

    return NextResponse.json({ 
      message: "Player removed from tournament",
      playerId,
      tournamentId
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 