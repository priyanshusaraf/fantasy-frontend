import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";

/**
 * GET /api/tournaments/[id]/join-requests
 * Get all join requests for a tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;
    const tournamentId = parseInt(params.id);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentAdmin: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to view join requests
    const isTournamentAdmin = tournament.tournamentAdmin.userId === user?.id;
    const isMasterAdmin = user?.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        { message: "Not authorized to view join requests for this tournament" },
        { status: 403 }
      );
    }

    // Get all join requests for the tournament
    const joinRequests = await prisma.tournamentJoinRequest.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(joinRequests);
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/tournaments/[id]/join-requests
 * Create a new join request for a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;
    const tournamentId = parseInt(params.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const { role, message, invitationCode } = await request.json();

    if (!role) {
      return NextResponse.json(
        { message: "Role is required" },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (!["PLAYER", "REFEREE", "TEAM_CAPTAIN"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role. Must be PLAYER, REFEREE, or TEAM_CAPTAIN" },
        { status: 400 }
      );
    }

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

    // Check if user already has a pending join request
    const existingRequest = await prisma.tournamentJoinRequest.findFirst({
      where: {
        tournamentId,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: "You already have a pending join request for this tournament" },
        { status: 400 }
      );
    }

    // If invitation code is provided, check if it's valid
    if (invitationCode) {
      const invitation = await prisma.tournamentInvitation.findFirst({
        where: {
          tournamentId,
          invitationCode,
          status: "PENDING",
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!invitation) {
        return NextResponse.json(
          { message: "Invalid or expired invitation code" },
          { status: 400 }
        );
      }

      // If invitation is for a specific user, check if it matches
      if (invitation.invitedUserId && invitation.invitedUserId !== user.id) {
        return NextResponse.json(
          { message: "This invitation is for another user" },
          { status: 403 }
        );
      }

      // If invitation is for a specific email, check if it matches
      if (invitation.invitedEmail && invitation.invitedEmail !== user.email) {
        return NextResponse.json(
          { message: "This invitation is for another email address" },
          { status: 403 }
        );
      }

      // Update invitation status to ACCEPTED
      await prisma.tournamentInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
    }

    // Create join request
    const joinRequest = await prisma.tournamentJoinRequest.create({
      data: {
        tournamentId,
        userId: user.id,
        role,
        status: "PENDING",
        message: message || null,
      },
    });

    return NextResponse.json(joinRequest, { status: 201 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * PUT /api/tournaments/[id]/join-requests
 * Update a join request (approve or reject)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Get current user from auth middleware
    const { user } = request;
    const tournamentId = parseInt(params.id);

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const { requestId, status, feedback } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { message: "Request ID and status are required" },
        { status: 400 }
      );
    }

    // Check if status is valid
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentAdmin: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to update join requests
    const isTournamentAdmin = tournament.tournamentAdmin.userId === user?.id;
    const isMasterAdmin = user?.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        { message: "Not authorized to update join requests for this tournament" },
        { status: 403 }
      );
    }

    // Check if join request exists and belongs to this tournament
    const joinRequest = await prisma.tournamentJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
      },
    });

    if (!joinRequest || joinRequest.tournamentId !== tournamentId) {
      return NextResponse.json(
        { message: "Join request not found" },
        { status: 404 }
      );
    }

    // Update join request
    const updatedRequest = await prisma.tournamentJoinRequest.update({
      where: { id: requestId },
      data: {
        status,
        feedback: feedback || null,
        updatedAt: new Date(),
      },
    });

    // If approved, add user to tournament based on role
    if (status === "APPROVED") {
      if (joinRequest.role === "PLAYER") {
        // Add player to tournament
        await prisma.tournamentEntry.create({
          data: {
            tournamentId,
            playerId: joinRequest.userId,
            status: "CONFIRMED",
          },
        });
      } else if (joinRequest.role === "REFEREE") {
        // Add referee to tournament
        // First check if user is a referee
        const referee = await prisma.referee.findFirst({
          where: { userId: joinRequest.userId },
        });

        if (!referee) {
          // Create referee record if it doesn't exist
          const newReferee = await prisma.referee.create({
            data: {
              userId: joinRequest.userId,
              status: "ACTIVE",
            },
          });

          // Add referee to tournament
          await prisma.tournamentReferee.create({
            data: {
              tournamentId,
              refereeId: newReferee.id,
              status: "CONFIRMED",
            },
          });
        } else {
          // Add existing referee to tournament
          await prisma.tournamentReferee.create({
            data: {
              tournamentId,
              refereeId: referee.id,
              status: "CONFIRMED",
            },
          });
        }
      }

      // TODO: Send notification to user that their request was approved
    } else {
      // TODO: Send notification to user that their request was rejected
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 