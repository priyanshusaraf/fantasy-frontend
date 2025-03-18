import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get referee ID - FIXED: Parse the string ID to an integer
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    if (!user || (user.role !== "REFEREE" && user.role !== "ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    console.log("Fetching tournaments with filters:", { status, search });

    // Base query conditions - remove status filter to show all tournaments regardless of status
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // First fetch all tournaments
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        tournamentAdmin: {
          include: {
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        },
        entries: true,
      },
    });

    console.log(`Found ${tournaments.length} tournaments in database:`, 
      tournaments.map(t => ({ id: t.id, name: t.name, status: t.status })));

    // Get the referee record
    const referee = await prisma.referee.findUnique({
      where: { userId: user.id },
    });

    if (!referee) {
      // If the user doesn't have a referee record, just return the tournaments without status
      const result = {
        tournaments: tournaments.map(tournament => ({
          id: tournament.id,
          name: tournament.name,
          description: tournament.description,
          location: tournament.location,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          status: tournament.status,
          registrationStatus: tournament.status === "DRAFT" ? "CLOSED" : 
                           (new Date() >= tournament.registrationOpenDate && new Date() <= tournament.registrationCloseDate) 
                            ? "OPEN" : "CLOSED",
          refereeCount: 0,
          refereeNeeded: 5,
          playerCount: tournament.entries.length,
          applicationStatus: "NOT_APPLIED",
          imageUrl: tournament.imageUrl,
        })),
      };
      console.log(`Returning ${result.tournaments.length} tournaments`);
      return NextResponse.json(result);
    }

    // Get referee join requests 
    const refereeJoinRequests = await prisma.refereeJoinRequest.findMany({
      where: {
        refereeId: referee.id,
      },
    });

    const requestMap = new Map();
    refereeJoinRequests.forEach(request => {
      requestMap.set(request.tournamentId, request.status);
    });

    // Now check which tournaments this referee is assigned to
    const assignedMatches = await prisma.match.findMany({
      where: {
        refereeId: referee.id,
      },
      select: {
        tournamentId: true,
      },
      distinct: ['tournamentId'],
    });

    const assignedTournamentIds = new Set(assignedMatches.map(match => match.tournamentId));

    // Get tournaments with referee assignments
    const tournamentsWithStatus = tournaments.map(tournament => {
      // Check if user is already assigned to this tournament
      const isAssigned = assignedTournamentIds.has(tournament.id);
      
      // Check if user has applied to this tournament
      const requestStatus = requestMap.get(tournament.id);
      
      // Calculate referee counts - we'll need a separate query for this
      const refereeNeeded = 5; // Using a default since maxReferees isn't in the schema
      
      let status = "NOT_APPLIED";
      if (isAssigned) {
        status = "ACCEPTED";
      } else if (requestStatus) {
        status = requestStatus;
      }

      return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        location: tournament.location,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        status: tournament.status,
        registrationStatus: tournament.status === "DRAFT" ? "CLOSED" : 
                           (new Date() >= tournament.registrationOpenDate && new Date() <= tournament.registrationCloseDate) 
                            ? "OPEN" : "CLOSED",
        refereeCount: 0, // We would need a more complex query to get the actual count
        refereeNeeded,
        playerCount: tournament.entries.length,
        applicationStatus: status,
        imageUrl: tournament.imageUrl,
      };
    });

    const result = { tournaments: tournamentsWithStatus };
    console.log(`Returning ${result.tournaments.length} tournaments with status`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching referee tournaments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 