// src/app/api/fantasy-pickleball/contests/[id]/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { errorHandler } from "@/middleware/error-handler";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const contestId = parseInt(params.id);
    
    console.log(`Fetching players for contest ID: ${contestId}`);
    
    if (isNaN(contestId)) {
      console.log(`Invalid contest ID: ${contestId}`);
      return NextResponse.json(
        { message: "Invalid contest ID" },
        { status: 400 }
      );
    }

    // Get contest and its rules
    console.log(`Finding contest with ID: ${contestId}`);
    const contest = await prisma.fantasyContest.findUnique({
      where: { id: contestId },
      select: {
        tournamentId: true,
        // Include any other fields you need from the contest
      },
    });

    if (!contest) {
      console.log(`Contest not found: ${contestId}`);
      return NextResponse.json(
        { message: "Contest not found" },
        { status: 404 }
      );
    }

    console.log(`Found contest with tournament ID: ${contest.tournamentId}`);

    // Parse rules (from a separate source or default values)
    let rules = {};
    // Set default rules
    const defaultRules = {
      walletSize: 100000,
      teamSize: 7,
      playerCategories: [
        { name: "PROFESSIONAL", price: 10000 },
        { name: "ADVANCED", price: 7500 },
        { name: "INTERMEDIATE", price: 5000 },
        { name: "BEGINNER", price: 2500 }
      ]
    };

    // Use default rules since 'rules' field doesn't exist in the schema
    rules = defaultRules;

    // Get all players in tournament
    console.log(`Finding players for tournament ID: ${contest.tournamentId}`);
    const dbPlayers = await prisma.player.findMany({
      where: {
        tournamentEntries: {
          some: {
            tournamentId: contest.tournamentId,
          },
        },
      },
      include: {
        teamMemberships: {
          where: {
            tournamentId: contest.tournamentId
          }
        }
      }
    });

    console.log(`Found ${dbPlayers.length} players in the database for the tournament`);

    // Process real players to include team info
    let players = dbPlayers.map(player => {
      // Get team information if available
      const team = player.teamMemberships.length > 0 ? player.teamMemberships[0] : null;
      
      return {
        ...player,
        teamId: team?.id || null,
        teamName: team?.name || null,
        // Remove teamMemberships to clean up the response
        teamMemberships: undefined
      };
    });

    // If no players found in the database, provide mock data
    if (players.length === 0) {
      console.log("No real players found, using mock players instead");
      
      // Common properties for all mock players
      const now = new Date();
      const mockPlayerBase = {
        userId: null,
        age: 30,
        tournamentWins: 0,
        careerWinRate: 0.5,
        bio: "Mock player for fantasy contest",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        teamId: null,
        teamName: null,
        teamMemberships: undefined
      };
      
      // Create mock players
      const mockPlayers = [
        {
          ...mockPlayerBase,
          id: 1001,
          name: "Alex Johnson",
          imageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
          skillLevel: "PROFESSIONAL",
          country: "USA",
          dominantHand: "RIGHT",
          rank: 1,
        },
        {
          ...mockPlayerBase,
          id: 1002,
          name: "Maria Garcia",
          imageUrl: "https://randomuser.me/api/portraits/women/2.jpg",
          skillLevel: "PROFESSIONAL",
          country: "Spain",
          dominantHand: "RIGHT",
          rank: 2,
        },
        {
          ...mockPlayerBase,
          id: 1003,
          name: "Raj Patel",
          imageUrl: "https://randomuser.me/api/portraits/men/3.jpg",
          skillLevel: "ADVANCED",
          country: "India",
          dominantHand: "LEFT",
          rank: 5,
        },
        {
          ...mockPlayerBase,
          id: 1004,
          name: "Sarah Kim",
          imageUrl: "https://randomuser.me/api/portraits/women/4.jpg",
          skillLevel: "ADVANCED",
          country: "South Korea",
          dominantHand: "RIGHT",
          rank: 7,
        },
        {
          ...mockPlayerBase,
          id: 1005,
          name: "Carlos Mendez",
          imageUrl: "https://randomuser.me/api/portraits/men/5.jpg",
          skillLevel: "INTERMEDIATE",
          country: "Mexico",
          dominantHand: "RIGHT",
          rank: 15,
        },
        {
          ...mockPlayerBase,
          id: 1006,
          name: "Emma Watson",
          imageUrl: "https://randomuser.me/api/portraits/women/6.jpg",
          skillLevel: "INTERMEDIATE",
          country: "UK",
          dominantHand: "RIGHT",
          rank: 18,
        },
        {
          ...mockPlayerBase,
          id: 1007,
          name: "Liu Wei",
          imageUrl: "https://randomuser.me/api/portraits/men/7.jpg",
          skillLevel: "BEGINNER",
          country: "China",
          dominantHand: "LEFT",
          rank: 25,
        },
        {
          ...mockPlayerBase,
          id: 1008,
          name: "Anna Schmidt",
          imageUrl: "https://randomuser.me/api/portraits/women/8.jpg",
          skillLevel: "BEGINNER",
          country: "Germany",
          dominantHand: "RIGHT",
          rank: 30,
        },
        {
          ...mockPlayerBase,
          id: 1009,
          name: "John Smith",
          imageUrl: "https://randomuser.me/api/portraits/men/9.jpg",
          skillLevel: "PROFESSIONAL",
          country: "Australia",
          dominantHand: "RIGHT",
          rank: 3,
        },
        {
          ...mockPlayerBase,
          id: 1010,
          name: "Priyanka Sharma",
          imageUrl: "https://randomuser.me/api/portraits/women/10.jpg",
          skillLevel: "ADVANCED",
          country: "India",
          dominantHand: "RIGHT",
          rank: 10,
        },
        {
          ...mockPlayerBase,
          id: 1011,
          name: "David Lee",
          imageUrl: "https://randomuser.me/api/portraits/men/11.jpg",
          skillLevel: "INTERMEDIATE",
          country: "Canada",
          dominantHand: "RIGHT",
          rank: 20,
        },
      ];
      
      // Use type assertion to get around Prisma type checking for mock data
      players = mockPlayers.map((player, index) => {
        // Assign players to mock teams
        const teamId = Math.floor(index / 3) + 1;
        const teamNames = ["Smash Hitters", "Paddle Masters", "Court Kings", "Net Aces"];
        
        return {
          ...player,
          teamId,
          teamName: teamNames[teamId - 1],
          teamMemberships: undefined
        };
      }) as typeof players;
    }

    // Calculate fantasy price for each player based on rules or skill level
    const playersWithPrices = players.map((player) => {
      // Set price based on skill level
      let price;
      switch (player.skillLevel) {
        case "PROFESSIONAL":
          price = 10000;
          break;
        case "ADVANCED":
          price = 7500;
          break;
        case "INTERMEDIATE":
          price = 5000;
          break;
        case "BEGINNER":
          price = 2500;
          break;
        default:
          price = 5000;
      }

      return {
        ...player,
        price,
      };
    });

    console.log(`Returning ${playersWithPrices.length} players with prices`);
    console.log(`Wallet size: ${(rules as any).walletSize || 100000}`);
    console.log(`Max team size: ${(rules as any).teamSize || (rules as any).fantasyTeamSize || 7}`);

    return NextResponse.json({
      players: playersWithPrices,
      walletSize: (rules as any).walletSize || 100000,
      maxTeamSize: (rules as any).teamSize || (rules as any).fantasyTeamSize || 7,
    });
  } catch (error) {
    console.error("Error fetching players for contest:", error);
    return errorHandler(error as Error, request);
  }
}
