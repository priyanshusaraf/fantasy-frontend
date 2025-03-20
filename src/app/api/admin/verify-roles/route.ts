import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get either userId from query params or use the authenticated user's ID
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') 
      ? Number(searchParams.get('userId')) 
      : (session.user.id as number);

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Only admins can check other users
    if (userId !== session.user.id && 
        session.user.role !== "MASTER_ADMIN" && 
        session.user.role !== "TOURNAMENT_ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to check other users' roles" },
        { status: 403 }
      );
    }

    // Get user with related role records
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tournamentAdmin: true,
        player: true,
        referee: true,
        masterAdmin: true,
        accounts: {
          select: {
            id: true,
            provider: true,
            type: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prepare response (exclude sensitive data)
    const roleInfo = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      hasPasswordAuth: !!user.password,
      authProviders: user.accounts.map(acc => acc.provider),
      roleRecords: {
        hasTournamentAdmin: !!user.tournamentAdmin,
        hasPlayer: !!user.player,
        hasReferee: !!user.referee,
        hasMasterAdmin: !!user.masterAdmin
      }
    };

    return NextResponse.json({ 
      message: "User role verification successful", 
      user: roleInfo 
    });
  } catch (error) {
    console.error("Error verifying user roles:", error);
    return NextResponse.json(
      { error: "Failed to verify user roles" },
      { status: 500 }
    );
  }
} 