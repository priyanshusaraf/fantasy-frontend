import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    if (!user || !["ADMIN", "TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized: Administrative privileges required" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { tournamentId, playerId } = body;

    // Validate request body
    if (!tournamentId || !playerId) {
      return NextResponse.json(
        { error: "Missing required fields: tournamentId and playerId" },
        { status: 400 }
      );
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(tournamentId) },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: Number(playerId) },
      include: { user: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Check if player is already entered in the tournament
    const existingEntry = await prisma.tournamentEntry.findFirst({
      where: {
        tournamentId: Number(tournamentId),
        playerId: Number(playerId),
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Player is already entered in this tournament" },
        { status: 409 }
      );
    }

    // Add player to tournament
    const newEntry = await prisma.tournamentEntry.create({
      data: {
        tournamentId: Number(tournamentId),
        playerId: Number(playerId),
        paymentStatus: 'PAID', // Auto-approve since admin is adding
      },
    });

    // Log the action
    console.log(`Admin ${session.user.name || session.user.id} added player ${player.id} to tournament ${tournament.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "Player added to tournament successfully",
      data: newEntry
    });

  } catch (error) {
    console.error("Error adding player to tournament:", error);
    return NextResponse.json(
      { error: "Failed to add player to tournament" },
      { status: 500 }
    );
  }
} 