import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/tournaments/[id]/invitations
 * Get all invitations for a tournament
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

    // Check if user is authorized to view invitations
    const isTournamentAdmin = tournament.tournamentAdmin.userId === user.id;
    const isMasterAdmin = user.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        { message: "Not authorized to view invitations for this tournament" },
        { status: 403 }
      );
    }

    // Get all invitations for the tournament
    const invitations = await prisma.tournamentInvitation.findMany({
      where: { tournamentId },
      include: {
        invitedUser: {
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

    return NextResponse.json(invitations);
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/tournaments/[id]/invitations
 * Create a new invitation for a tournament
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

    if (isNaN(tournamentId)) {
      return NextResponse.json(
        { message: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const { email, role, message } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { message: "Email and role are required" },
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

    // Check if user is authorized to create invitations
    const isTournamentAdmin = tournament.tournamentAdmin.userId === user.id;
    const isMasterAdmin = user.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        { message: "Not authorized to create invitations for this tournament" },
        { status: 403 }
      );
    }

    // Check if user with email exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    // Generate invitation code
    const invitationCode = uuidv4();

    // Create invitation
    const invitation = await prisma.tournamentInvitation.create({
      data: {
        tournamentId,
        invitedEmail: email,
        invitedUserId: invitedUser?.id,
        role,
        status: "PENDING",
        invitationCode,
        message: message || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // TODO: Send email notification to invited user

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * DELETE /api/tournaments/[id]/invitations
 * Delete an invitation
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
    const { invitationId } = await request.json();

    if (!invitationId) {
      return NextResponse.json(
        { message: "Invitation ID is required" },
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

    // Check if user is authorized to delete invitations
    const isTournamentAdmin = tournament.tournamentAdmin.userId === user.id;
    const isMasterAdmin = user.role === "MASTER_ADMIN";

    if (!isTournamentAdmin && !isMasterAdmin) {
      return NextResponse.json(
        { message: "Not authorized to delete invitations for this tournament" },
        { status: 403 }
      );
    }

    // Check if invitation exists and belongs to this tournament
    const invitation = await prisma.tournamentInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.tournamentId !== tournamentId) {
      return NextResponse.json(
        { message: "Invitation not found" },
        { status: 404 }
      );
    }

    // Delete invitation
    await prisma.tournamentInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json(
      { message: "Invitation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 