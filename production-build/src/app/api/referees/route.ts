import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
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
        isUserOnly: true, // Mark as user-only to indicate we need to create a referee record
      });
    });
    
    // Convert map to array and return
    const referees = Array.from(refereeMap.values());
    
    console.log(`Returning ${referees.length} total referees (${refereeRecords.length} from referee records + ${refereeUsers.length} from user records with REFEREE role)`);
    
    return NextResponse.json({ referees });
  } catch (error) {
    return errorHandler(error as Error, request);
  }
}

/**
 * POST /api/referees
 * Create a new referee
 */
export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Skip authentication in development mode
    let user;
    if (process.env.NODE_ENV === 'development') {
      console.log("⚠️ DEVELOPMENT MODE: Bypassing auth for referee creation");
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
      
      // Only admin, tournament_admin and master_admin can create referees
      if (!user || !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { message: "Not authorized to create referees" },
          { status: 403 }
        );
      }
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: `User with ID ${data.userId} not found` },
        { status: 404 }
      );
    }

    // Update user role if they are not already a referee
    if (existingUser.role !== "REFEREE") {
      await prisma.user.update({
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
      console.log(`User ${existingUser.id} already has referee profile ${existingReferee.id}`);
      return NextResponse.json(existingReferee);
    }

    // Create a new referee
    const referee = await prisma.referee.create({
      data: {
        userId: existingUser.id,
        certificationLevel: data.certificationLevel || "LEVEL_1",
      },
    });

    console.log(`Created new referee: ${referee.id} for user: ${existingUser.id}`);

    return NextResponse.json(referee);
  } catch (error) {
    return errorHandler(error as Error, request);
  }
} 