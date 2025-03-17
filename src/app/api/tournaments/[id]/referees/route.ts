import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/tournaments/[id]/referees
 * Get all referees in a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the tournament ID properly
    const tournamentId = parseInt(params.id);
    
    if (isNaN(tournamentId)) {
      console.error("Invalid tournament ID:", params.id);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching referees for tournament: ${tournamentId}`);

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { 
        tournamentAdmin: true 
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get all referees in the tournament - there are potentially multiple ways a referee could be assigned
    // 1. Through the RefereeJoinRequests table with APPROVED status
    const approvedRequests = await prisma.refereeJoinRequest.findMany({
      where: { 
        tournamentId,
        status: "APPROVED" 
      },
      include: {
        referee: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${approvedRequests.length} referee join requests for tournament ${tournamentId}`);
    
    // Extract unique referees from the approved requests
    const refereeMap = new Map();
    
    approvedRequests.forEach((request) => {
      if (request.referee) {
        const referee = request.referee;
        const user = referee.user;
        
        refereeMap.set(referee.id, {
          id: referee.id,
          userId: referee.userId,
          name: user ? (user.username || "Unnamed Referee") : "Unnamed Referee",
          email: user?.email || "",
          certificationLevel: referee.certificationLevel,
        });
      }
    });
    
    // Convert the map to an array
    const referees = Array.from(refereeMap.values());
    
    console.log(`Returning ${referees.length} referees for tournament ${tournamentId}`);
    
    return NextResponse.json({ referees });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/tournaments/[id]/referees
 * Add a referee to a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TEMPORARY: Skip authentication in development mode
    let user;
    if (process.env.NODE_ENV === 'development') {
      console.log("⚠️ DEVELOPMENT MODE: Bypassing auth for adding referees to tournament");
      // Mock user with admin privileges
      user = { role: "MASTER_ADMIN", id: 1 };
    } else {
      // Check authentication and authorization
      const authResult = await authMiddleware(request);
      if (authResult.status !== 200) {
        return authResult;
      }
      
      const { user: authUser } = request as any;
      user = authUser;
      
      // Only admin, tournament_admin and master_admin can add referees
      if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { message: "Not authorized to add referees to tournaments" },
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
    
    console.log(`Adding referees to tournament: ${tournamentId}`);

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

    // Get referee data from request body
    const body = await request.json();
    
    // Handle both single referee addition and multiple referee addition
    const refereeIds = body.refereeIds || (body.refereeId ? [body.refereeId] : []);
    
    if (refereeIds.length === 0) {
      return NextResponse.json(
        { message: "No referees specified" },
        { status: 400 }
      );
    }

    console.log(`Adding ${refereeIds.length} referees to tournament ${tournamentId}: ${refereeIds.join(', ')}`);
    
    // Create join requests for each referee
    const results = await Promise.all(
      refereeIds.map(async (refereeId: number) => {
        try {
          // Check if this referee already has a join request
          const existingRequest = await prisma.refereeJoinRequest.findFirst({
            where: {
              tournamentId,
              refereeId,
            },
          });

          if (existingRequest) {
            // If it exists but isn't approved, approve it
            if (existingRequest.status !== "APPROVED") {
              await prisma.refereeJoinRequest.update({
                where: { id: existingRequest.id },
                data: { status: "APPROVED" },
              });
              
              return { refereeId, status: "approved" };
            }
            
            return { refereeId, status: "already_approved" };
          }

          // Create a new approved request
          await prisma.refereeJoinRequest.create({
            data: {
              tournamentId,
              refereeId,
              status: "APPROVED", // Auto-approve when added by admin
            },
          });

          return { refereeId, status: "added" };
        } catch (error) {
          console.error(`Error adding referee ${refereeId}:`, error);
          return { refereeId, status: "error", error: (error as Error).message };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * DELETE /api/tournaments/[id]/referees/[refereeId]
 * Remove a referee from a tournament
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TEMPORARY: Skip authentication in development mode
    let user;
    if (process.env.NODE_ENV === 'development') {
      console.log("⚠️ DEVELOPMENT MODE: Bypassing auth for removing referees from tournament");
      // Mock user with admin privileges
      user = { role: "MASTER_ADMIN", id: 1 };
    } else {
      // Check authentication and authorization
      const authResult = await authMiddleware(request);
      if (authResult.status !== 200) {
        return authResult;
      }
      
      const { user: authUser } = request as any;
      user = authUser;
      
      // Only admin, tournament_admin and master_admin can remove referees
      if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { message: "Not authorized to remove referees from tournaments" },
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

    // Get referee ID from URL or request body
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const refereeIdFromPath = pathParts[pathParts.length - 1];
    
    let refereeId: number;
    
    if (refereeIdFromPath && refereeIdFromPath !== 'referees') {
      refereeId = parseInt(refereeIdFromPath);
    } else {
      const body = await request.json();
      refereeId = body.refereeId;
    }

    if (!refereeId || isNaN(refereeId)) {
      return NextResponse.json(
        { message: "Valid referee ID is required" },
        { status: 400 }
      );
    }

    console.log(`Removing referee ${refereeId} from tournament ${tournamentId}`);
    
    // Delete all join requests for this referee in this tournament
    await prisma.refereeJoinRequest.deleteMany({
      where: {
        tournamentId,
        refereeId,
      },
    });

    return NextResponse.json({ 
      message: "Referee removed from tournament",
      refereeId,
      tournamentId
    });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 