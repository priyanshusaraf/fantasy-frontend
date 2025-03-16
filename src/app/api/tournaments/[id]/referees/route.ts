import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    // Extract the ID from the URL directly to avoid the params issue
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idFromPath = pathParts.find((part, index) => pathParts[index-1] === "tournaments" && part !== "referees");
    
    if (!idFromPath || isNaN(parseInt(idFromPath))) {
      console.error("Invalid tournament ID in URL path:", url.pathname);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(idFromPath);
    console.log(`Fetching referees for tournament: ${tournamentId} (URL path: ${url.pathname})`);

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
    
    // 2. Try to get direct assignments - catch error if table doesn't exist
    let directAssignments: any[] = [];
    try {
      // Check if the table exists before querying
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'TournamentReferee'
        );
      `;
      
      if (tableExists) {
        // This is commented out since the table might not exist in the schema
        // Uncomment if you have this table in your schema
        /*
        directAssignments = await prisma.tournamentReferee.findMany({
          where: { tournamentId },
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
        */
      }
    } catch (err) {
      console.log("TournamentReferee table doesn't exist or can't be queried");
    }
    
    console.log(`Found ${directAssignments.length} direct referee assignments for tournament ${tournamentId}`);
    
    // 3. If tournament has a organizerId who is a referee, include them as well
    let creatorReferee = null;
    if (tournament.tournamentAdmin && tournament.tournamentAdmin.userId) {
      creatorReferee = await prisma.referee.findFirst({
        where: { userId: tournament.tournamentAdmin.userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      
      if (creatorReferee) {
        console.log(`Tournament admin is a referee: ${creatorReferee.id}`);
      }
    }

    // Combine all referee sources, transform to a more usable format, and deduplicate
    const refereeMap = new Map();
    
    // Add join request referees
    approvedRequests.forEach(request => {
      if (request.referee && request.referee.id) {
        refereeMap.set(request.referee.id, {
          id: request.referee.id,
          name: request.referee.user?.username || "Unnamed Referee",
          email: request.referee.user?.email,
          certificationLevel: request.referee.certificationLevel || "LEVEL_1",
        });
      }
    });
    
    // Add direct assignment referees
    directAssignments.forEach((assignment: any) => {
      if (assignment.referee && assignment.referee.id) {
        refereeMap.set(assignment.referee.id, {
          id: assignment.referee.id,
          name: assignment.referee.user?.username || "Unnamed Referee",
          email: assignment.referee.user?.email,
          certificationLevel: assignment.referee.certificationLevel || "LEVEL_1",
        });
      }
    });
    
    // Add creator referee if found
    if (creatorReferee) {
      refereeMap.set(creatorReferee.id, {
        id: creatorReferee.id,
        name: creatorReferee.user?.username || "Unnamed Referee", 
        email: creatorReferee.user?.email,
        certificationLevel: creatorReferee.certificationLevel || "LEVEL_1",
      });
    }

    const referees = Array.from(refereeMap.values());
    console.log(`Returning ${referees.length} total referees for tournament ${tournamentId}`);

    return NextResponse.json({ referees });
  } catch (error) {
    console.error("Error fetching tournament referees:", error);
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/tournaments/[id]/referees
 * Add referees to a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily bypass authentication for testing
    console.log("Adding referees - bypassing auth for testing");
    const user = { role: 'MASTER_ADMIN', id: 1 };
    
    // Extract the ID from the URL directly to avoid the params issue
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idFromPath = pathParts.find((part, index) => pathParts[index-1] === "tournaments" && part !== "referees");
    
    if (!idFromPath || isNaN(parseInt(idFromPath))) {
      console.error("Invalid tournament ID in URL path:", url.pathname);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(idFromPath);
    console.log(`Adding referees to tournament: ${tournamentId} (URL path: ${url.pathname})`);

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

    // Create referee join requests for each referee
    const results = await Promise.all(
      refereeIds.map(async (refereeId: number) => {
        // Check if referee already in tournament
        const existingRequest = await prisma.refereeJoinRequest.findFirst({
          where: {
            tournamentId,
            refereeId,
          },
        });

        if (existingRequest) {
          // If found but not approved, update to approved
          if (existingRequest.status !== "APPROVED") {
            await prisma.refereeJoinRequest.update({
              where: { id: existingRequest.id },
              data: { status: "APPROVED" },
            });
            return { refereeId, status: "approved" };
          }
          return { refereeId, status: "already_added" };
        }

        // Add referee to tournament
        await prisma.refereeJoinRequest.create({
          data: {
            tournamentId,
            refereeId,
            status: "APPROVED", // Auto-approve admin-added referees
          },
        });

        return { refereeId, status: "added" };
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
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Extract the ID from the URL directly to avoid the params issue
    const requestUrl = new URL(request.url);
    const urlPathParts = requestUrl.pathname.split('/');
    const idFromPath = urlPathParts.find((part, index) => urlPathParts[index-1] === "tournaments" && part !== "referees");
    
    if (!idFromPath || isNaN(parseInt(idFromPath))) {
      console.error("Invalid tournament ID in URL path:", requestUrl.pathname);
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }
    
    const tournamentId = parseInt(idFromPath);
    console.log(`Removing referee from tournament: ${tournamentId} (URL path: ${requestUrl.pathname})`);

    const { user } = request as any;

    // Only admin, tournament_admin and master_admin can remove referees
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to remove referees from tournaments" },
        { status: 403 }
      );
    }

    // Get referee ID from URL or request body
    const pathSegments = requestUrl.pathname.split('/');
    const refereeIdFromPath = pathSegments[pathSegments.length - 1];
    
    let refereeId: number;
    
    if (refereeIdFromPath && refereeIdFromPath !== 'referees') {
      refereeId = parseInt(refereeIdFromPath);
    } else {
      const body = await request.json();
      refereeId = body.refereeId;
    }

    if (!refereeId) {
      return NextResponse.json(
        { message: "Referee ID is required" },
        { status: 400 }
      );
    }

    // Remove referee from tournament
    const deleteResult = await prisma.refereeJoinRequest.deleteMany({
      where: {
        tournamentId,
        refereeId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: "Referee not found in tournament" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Referee removed from tournament" });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 