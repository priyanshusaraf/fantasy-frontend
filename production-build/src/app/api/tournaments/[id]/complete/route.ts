import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * POST /api/tournaments/[id]/complete
 * Complete a tournament and calculate final standings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || !['TOURNAMENT_ADMIN', 'MASTER_ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json(
        { message: "Unauthorized - Only tournament admins can complete tournaments" },
        { status: 401 }
      );
    }

    const tournamentId = parseInt(params.id);
    
    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    
    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }
    
    // Get the tournament organizer info
    const tournamentAdmin = await prisma.tournamentAdmin.findUnique({
      where: { id: tournament.organizerId },
      include: { user: true }
    });
    
    // Verify the user is the tournament admin or a master admin
    if (
      session.user.role !== 'MASTER_ADMIN' && 
      tournamentAdmin?.userId !== session.user.id
    ) {
      return NextResponse.json(
        { message: "Unauthorized - You are not the admin of this tournament" },
        { status: 403 }
      );
    }
    
    // Check if tournament is already completed
    if (tournament.status === 'COMPLETED') {
      return NextResponse.json(
        { message: "Tournament is already completed" },
        { status: 400 }
      );
    }
    
    // 1. Verify all matches are completed
    const pendingMatches = await prisma.match.count({
      where: {
        tournamentId,
        status: { not: 'COMPLETED' }
      }
    });
    
    if (pendingMatches > 0) {
      return NextResponse.json(
        { message: `Tournament has ${pendingMatches} pending matches` },
        { status: 400 }
      );
    }
    
    // 2. Update tournament status
    const updatedTournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'COMPLETED' }
    });
    
    // 3. Calculate final fantasy leaderboard if fantasy is enabled
    if (tournament.fantasySettings) {
      try {
        // Parse fantasy settings
        const fantasySettings = JSON.parse(tournament.fantasySettings as string);
        
        if (fantasySettings.enableFantasy) {
          // Calculate final standings for fantasy teams
          await calculateFinalStandings(tournamentId);
        }
      } catch (error) {
        console.error("Error calculating fantasy standings:", error);
        // Continue with tournament completion even if fantasy calculation fails
      }
    }
    
    return NextResponse.json({ 
      message: "Tournament completed successfully",
      tournament: updatedTournament,
      nextStep: `/api/tournaments/${tournamentId}/distribute-prizes`
    });
  } catch (error) {
    console.error("Error completing tournament:", error);
    return NextResponse.json(
      { message: "Failed to complete tournament", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Calculate final standings for all fantasy teams in the tournament
 */
async function calculateFinalStandings(tournamentId: number) {
  try {
    // Check if the necessary fields exist before proceeding
    // First verify the structure of your fantasy teams
    const fantasyTeamSample = await prisma.$queryRaw`
      SELECT * FROM FantasyTeam 
      WHERE tournamentId = ${tournamentId}
      LIMIT 1
    `;
    
    if (!Array.isArray(fantasyTeamSample) || fantasyTeamSample.length === 0) {
      console.log("No fantasy teams found for this tournament");
      return false;
    }
    
    // Use raw queries to be safer
    // Get all active fantasy teams
    const fantasyTeams = await prisma.$queryRaw`
      SELECT * FROM FantasyTeam 
      WHERE tournamentId = ${tournamentId} 
      AND status = 'ACTIVE'
    `;
    
    // Process each team
    for (const team of Array.isArray(fantasyTeams) ? fantasyTeams : []) {
      let totalPoints = 0;
      
      try {
        // Get team players using a join table if it exists
        // This assumes there's a FantasyTeamPlayer join table
        const teamPlayers = await prisma.$queryRaw`
          SELECT p.* 
          FROM Player p
          JOIN FantasyTeamPlayer ftp ON p.id = ftp.playerId
          WHERE ftp.fantasyTeamId = ${(team as any).id}
        `;
        
        // Calculate points for each player
        for (const player of Array.isArray(teamPlayers) ? teamPlayers : []) {
          // Get player scores from completed matches
          const playerScores = await prisma.$queryRaw`
            SELECT s.* 
            FROM Score s
            JOIN Match m ON s.matchId = m.id
            WHERE m.tournamentId = ${tournamentId}
            AND m.status = 'COMPLETED'
            AND s.playerId = ${(player as any).id}
          `;
          
          // Calculate points based on scores
          let playerPoints = 0;
          for (const score of Array.isArray(playerScores) ? playerScores : []) {
            // Simple scoring logic - customize as needed
            playerPoints += (score as any).isWinner ? 5 : 0;
            playerPoints += (score as any).points || 0;
          }
          
          totalPoints += playerPoints;
        }
        
        // Update fantasy team with final points
        // First check if totalPoints column exists
        const hasPointsColumn = await prisma.$queryRaw`
          SHOW COLUMNS FROM FantasyTeam LIKE 'totalPoints'
        `;
        
        if (Array.isArray(hasPointsColumn) && hasPointsColumn.length > 0) {
          await prisma.$executeRaw`
            UPDATE FantasyTeam 
            SET totalPoints = ${totalPoints}
            WHERE id = ${(team as any).id}
          `;
        } else {
          console.log("totalPoints column not found in FantasyTeam table");
        }
      } catch (playerError) {
        console.error(`Error processing team ${(team as any).id}:`, playerError);
        // Continue with next team
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in calculateFinalStandings:", error);
    return false;
  }
} 