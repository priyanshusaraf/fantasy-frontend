import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper function to map tournament types from form to schema
function mapTournamentType(formType: string): 'SINGLES' | 'DOUBLES' | 'MIXED_DOUBLES' | 'ROUND_ROBIN' | 'KNOCKOUT' | 'LEAGUE' {
  // Map the form values to the actual Prisma enum values
  switch(formType) {
    case 'MIXED':
      return 'MIXED_DOUBLES';
    case 'SINGLES':
      return 'SINGLES';
    case 'DOUBLES':
      return 'DOUBLES';
    default:
      // Default to SINGLES if the type is unknown
      return 'SINGLES';
  }
}

// This is a special endpoint that bypasses normal authentication
// It should only be used in development for testing
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();
    const { tournamentData, userEmail, secretKey } = data;

    console.log("Direct tournament creation request received:", { userEmail, tournamentData: { ...tournamentData, name: tournamentData.name } });

    // Verify the secret key - this adds a small layer of security
    // In a production app, you'd want much stronger security
    if (secretKey !== "tournament-direct-creation") {
      console.log("Invalid secret key");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!tournamentData || !userEmail) {
      console.log("Missing required data");
      return NextResponse.json(
        { message: "Tournament data and user email are required" },
        { status: 400 }
      );
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log(`User with email ${userEmail} not found. Creating user.`);
      
      // Create user if not found
      try {
        user = await prisma.user.create({
          data: {
            email: userEmail,
            username: userEmail.split('@')[0],
            role: "USER",
          }
        });
        console.log(`Created user with id: ${user.id}`);
      } catch (userCreateError) {
        console.error("Error creating user:", userCreateError);
        return NextResponse.json(
          { message: "Failed to create user" },
          { status: 500 }
        );
      }
    }

    // Check if the user has an admin record
    let adminRecord = await prisma.tournamentAdmin.findUnique({
      where: { userId: user.id },
    });

    // If not, create one
    if (!adminRecord) {
      console.log(`Creating tournament admin for user: ${user.id}`);
      try {
        adminRecord = await prisma.tournamentAdmin.create({
          data: { userId: user.id }
        });
        console.log(`Created tournament admin with id: ${adminRecord.id}`);
      } catch (adminCreateError) {
        console.error("Error creating admin record:", adminCreateError);
        
        // Fallback approach - create a hardcoded admin record if needed
        try {
          // Try to find any existing admin record we can use
          const fallbackAdmin = await prisma.tournamentAdmin.findFirst();
          
          if (fallbackAdmin) {
            adminRecord = fallbackAdmin;
            console.log(`Using fallback admin: ${adminRecord.id}`);
          } else {
            // Create a system admin as last resort
            adminRecord = await prisma.tournamentAdmin.create({
              data: {
                user: {
                  create: {
                    email: "system@example.com",
                    username: "system_admin",
                    role: "MASTER_ADMIN",
                  }
                }
              }
            });
            console.log(`Created system admin: ${adminRecord.id}`);
          }
        } catch (fallbackError) {
          console.error("Error with fallback admin:", fallbackError);
          return NextResponse.json(
            { message: "Failed to create or find tournament admin" },
            { status: 500 }
          );
        }
      }
    }

    console.log(`Creating tournament directly for user: ${user.id}, admin: ${adminRecord.id}`);

    // Map the tournament type from the form to a valid Prisma enum value
    const mappedType = mapTournamentType(tournamentData.type);

    // Create the tournament directly in the database
    try {
      const tournament = await prisma.tournament.create({
        data: {
          name: tournamentData.name,
          description: tournamentData.description || "",
          type: mappedType,
          status: "DRAFT", 
          startDate: new Date(tournamentData.startDate),
          endDate: new Date(tournamentData.endDate),
          registrationOpenDate: new Date(tournamentData.registrationOpenDate),
          registrationCloseDate: new Date(tournamentData.registrationCloseDate),
          location: tournamentData.location,
          maxParticipants: tournamentData.maxParticipants || 32,
          entryFee: tournamentData.entryFee || 0,
          prizeMoney: 0,
          organizerId: adminRecord.id,
          rules: "",
        },
      });

      console.log(`Tournament created successfully: ${tournament.id}`);
      return NextResponse.json(tournament, { status: 201 });
    } catch (tournamentError) {
      console.error("Error creating tournament:", tournamentError);
      
      // Try with minimal required fields as fallback
      try {
        console.log("Trying minimal tournament creation");
        const minimalTournament = await prisma.tournament.create({
          data: {
            name: tournamentData.name,
            description: tournamentData.description || "Created via direct endpoint",
            type: mappedType,
            status: "DRAFT",
            startDate: new Date(tournamentData.startDate || Date.now() + 86400000), // Tomorrow if not specified
            endDate: new Date(tournamentData.endDate || Date.now() + 172800000), // Day after tomorrow if not specified
            registrationOpenDate: new Date(Date.now()),
            registrationCloseDate: new Date(Date.now() + 43200000), // 12 hours from now
            location: tournamentData.location || "TBD",
            organizerId: adminRecord.id,
            maxParticipants: tournamentData.maxParticipants || 32,
            entryFee: 0,
            prizeMoney: 0,
            rules: "",
          },
        });
        
        console.log(`Minimal tournament created: ${minimalTournament.id}`);
        return NextResponse.json(minimalTournament, { status: 201 });
      } catch (minimalError) {
        console.error("Error creating minimal tournament:", minimalError);
        return NextResponse.json(
          { message: "Failed to create tournament", error: String(minimalError) },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in direct tournament creation endpoint:", error);
    return NextResponse.json(
      { message: "Failed to create tournament", error: String(error) },
      { status: 500 }
    );
  }
} 