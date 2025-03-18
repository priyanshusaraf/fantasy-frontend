import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { email, provider } = await request.json();

    if (!email || !provider) {
      return NextResponse.json(
        { message: "Email and provider are required" },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tournamentAdmin: true,
      },
    });

    if (!user) {
      console.error(`User with email ${email} not found`);
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // For development purposes, we'll always use TOURNAMENT_ADMIN role
    // In production, you would implement proper role checks
    const role = "TOURNAMENT_ADMIN";
    
    console.log(`Generating token for user: ${user.id}, role: ${role}`);

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role,
        username: user.username || ""
      },
      process.env.JWT_SECRET || "tournament-secret-key",
      { expiresIn: "1h" }
    );

    // Return the token
    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { message: "Failed to generate token" },
      { status: 500 }
    );
  }
} 