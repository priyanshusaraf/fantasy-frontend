import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/fantasy-pickleball/contests/[id]/user-team
 * Get the current user's team for a specific contest
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const contestId = parseInt(params.id);
    
    console.log(`Fetching team for user ${userId} in contest ${contestId}`);
    
    if (isNaN(contestId)) {
      return NextResponse.json(
        { message: "Invalid contest ID" },
        { status: 400 }
      );
    }
    
    // Fetch the user's team for this contest
    const team = await prisma.fantasyTeam.findFirst({
      where: {
        userId: userId,
        contestId: contestId,
      },
      include: {
        players: {
          include: {
            player: true,
          },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { message: "Team not found", team: null },
        { status: 200 }
      );
    }
    
    // Format team data for response
    const formattedTeam = {
      id: team.id,
      name: team.name,
      totalPoints: team.totalPoints,
      players: team.players.map((tp) => ({
        id: tp.player.id,
        name: tp.player.name,
        isCaptain: tp.isCaptain,
        isViceCaptain: tp.isViceCaptain,
        points: 0, // Would be calculated based on match performance
        imageUrl: tp.player.imageUrl,
        skillLevel: tp.player.skillLevel,
      })),
    };
    
    console.log(`Found team "${formattedTeam.name}" with ${formattedTeam.players.length} players`);
    
    return NextResponse.json(
      { team: formattedTeam },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user team:", error);
    return errorHandler(error as Error, request);
  }
} 