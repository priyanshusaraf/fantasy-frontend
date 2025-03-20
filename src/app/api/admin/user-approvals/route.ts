import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  try {
    // Get the current session to verify admin status
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user is an admin
    if (
      session.user.role !== "MASTER_ADMIN" &&
      session.user.role !== "TOURNAMENT_ADMIN"
    ) {
      return NextResponse.json(
        { message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch pending user approvals
    const pendingUsers = await prisma.user.findMany({
      where: {
        isApproved: false,
        role: {
          in: ["REFEREE", "TOURNAMENT_ADMIN"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        isApproved: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Fetch recently approved users
    const approvedUsers = await prisma.user.findMany({
      where: {
        isApproved: true,
        role: {
          in: ["REFEREE", "TOURNAMENT_ADMIN"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        isApproved: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    return NextResponse.json({
      pendingUsers: pendingUsers.map(user => ({
        id: user.id,
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        image: user.profileImage
      })),
      approvedUsers: approvedUsers.map(user => ({
        id: user.id,
        name: user.name || "Unnamed User",
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        image: user.profileImage
      }))
    });
  } catch (error) {
    console.error("Error fetching user approvals:", error);
    return NextResponse.json(
      { message: "Error fetching user approvals" },
      { status: 500 }
    );
  }
} 