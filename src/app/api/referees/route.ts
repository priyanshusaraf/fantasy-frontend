import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";

/**
 * GET /api/referees
 * List all referees in the system
 */
export async function GET(request: NextRequest) {
  try {
    // Temporarily bypass authentication for testing
    console.log("Fetching all referees (auth check bypassed for testing)...");
    
    // Get all referees with user data
    const refereeRecords = await prisma.referee.findMany({
      include: {
        user: true, // Include all user fields
      },
    });

    console.log(`Found ${refereeRecords.length} referee records`);
    
    // Log a few records for debugging
    if (refereeRecords.length > 0) {
      const sampleReferees = refereeRecords.slice(0, 3);
      sampleReferees.forEach((ref, i) => {
        console.log(`Referee ${i+1}: ID ${ref.id}, UserID: ${ref.userId}, Certification: ${ref.certificationLevel}`);
        console.log(`User info: ${ref.user?.username || 'No username'}, ${ref.user?.email || 'No email'}`);
      });
    }
    
    // Also get users with REFEREE role that might not have a Referee record
    const refereeUsers = await prisma.user.findMany({
      where: {
        role: "REFEREE",
        referee: null, // Only get users who don't have a referee record
      },
    });
    
    console.log(`Found ${refereeUsers.length} additional users with REFEREE role but no referee record`);
    
    // Create a map to deduplicate referees
    const refereeMap = new Map();
    
    // Format and add referee records to the map
    refereeRecords.forEach((referee) => {
      const user = referee.user;
      refereeMap.set(referee.id, {
        id: referee.id,
        userId: referee.userId,
        name: user ? (user.username || "Unnamed Referee") : "Unnamed Referee",
        email: user?.email || "",
        certificationLevel: referee.certificationLevel,
        profileImage: null, // We'll omit this for now since it's causing issues
      });
    });
    
    // Add users with REFEREE role but no referee record
    refereeUsers.forEach((user) => {
      // Create a synthetic referee ID (negative user ID to avoid conflicts)
      const syntheticId = -user.id;
      
      refereeMap.set(syntheticId, {
        id: syntheticId,
        userId: user.id,
        name: user.username || user.email?.split('@')[0] || "Unnamed Referee",
        email: user.email || "",
        certificationLevel: "LEVEL_1", // Default value
        profileImage: null,
        isUserOnly: true, // Flag to indicate this is a user without a referee record
      });
    });
    
    // Convert map to array
    const referees = Array.from(refereeMap.values());

    console.log(`Processed ${referees.length} total referees for response`);
    return NextResponse.json({ referees });
  } catch (error) {
    console.error("Error fetching referees:", error);
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/referees
 * Create a new referee (for admin use)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { user } = request as any;
    if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { message: "Not authorized to create referees" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if a user with this email already exists
    let existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!existingUser) {
      // Create a new user if not found
      existingUser = await prisma.user.create({
        data: {
          username: data.name,
          email: data.email,
          role: "REFEREE",
          // Set a temporary password that will need to be reset
          password: Math.random().toString(36).substring(2, 15),
        },
      });

      console.log(`Created new user for referee: ${existingUser.id}`);
    } else if (existingUser.role !== "REFEREE") {
      // Update user role if they exist but are not a referee
      existingUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: "REFEREE" },
      });
      
      console.log(`Updated user role to REFEREE: ${existingUser.id}`);
    }

    // Check if user already has a referee profile
    const existingReferee = await prisma.referee.findUnique({
      where: { userId: existingUser.id },
    });

    if (existingReferee) {
      // Return the existing referee
      console.log(`User already has a referee profile: ${existingReferee.id}`);
      return NextResponse.json({
        id: existingReferee.id,
        userId: existingUser.id,
        name: existingUser.username || data.name,
        email: existingUser.email,
        certificationLevel: existingReferee.certificationLevel,
      });
    }

    // Create a new referee profile
    const referee = await prisma.referee.create({
      data: {
        userId: existingUser.id,
        certificationLevel: data.certificationLevel || "LEVEL_1",
      },
    });

    console.log(`Created new referee profile: ${referee.id}`);

    return NextResponse.json({
      id: referee.id,
      userId: existingUser.id,
      name: existingUser.username || data.name,
      email: existingUser.email,
      certificationLevel: referee.certificationLevel,
    });
  } catch (error) {
    console.error("Error creating referee:", error);
    return errorHandler(error as Error, request);
  }
} 