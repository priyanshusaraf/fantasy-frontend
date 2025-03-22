// src/app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { SKILL_LEVELS } from "@/utils/constants";

const playerSchema = z.object({
  // ... other fields
  skillLevel: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'D']).optional(),
  // ... other fields
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50"); // Increased limit to show more players
    const search = searchParams.get("search") || "";
    const skillLevel = searchParams.get("skillLevel");

    // Build query conditions for standalone players 
    const playerWhere: any = {};

    if (search) {
      playerWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    if (skillLevel && skillLevel !== "ALL") {
      playerWhere.skillLevel = skillLevel;
    }

    // Get standalone players with pagination (players without associated users)
    const [standalonePlayers, totalStandalone] = await Promise.all([
      prisma.player.findMany({
        where: playerWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.player.count({ where: playerWhere }),
    ]);

    // Query for users with PLAYER role that might not have a Player record
    const userWhere: any = {
      role: "PLAYER",
    };

    if (search) {
      userWhere.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users with PLAYER role, including their player profile if it exists
    const playerUsers = await prisma.user.findMany({
      where: userWhere,
      include: {
        player: true,
      },
      orderBy: { username: "asc" },
    });

    console.log(`Found ${standalonePlayers.length} standalone players and ${playerUsers.length} player users`);

    // Create a map to deduplicate players
    const playerMap = new Map();
    
    // Add standalone players to the map
    standalonePlayers.forEach(player => {
      playerMap.set(player.id, {
        id: player.id,
        name: player.name,
        skillLevel: player.skillLevel,
        country: player.country,
        age: player.age,
        gender: player.gender,
        imageUrl: player.imageUrl,
        // Add more fields as needed
      });
    });
    
    // Add users with PLAYER role, but avoid duplicates if they already have a player record
    playerUsers.forEach(user => {
      // If this user already has a player record, it would be in standalonePlayers,
      // so we don't need to add it again
      if (!user.player) {
        // Create a synthetic player record for the user
        const syntheticPlayer = {
          id: user.id * -1, // Use negative ID to avoid conflicts with real player IDs
          name: user.username || user.email?.split('@')[0] || "Player",
          skillLevel: "B", // Updated default value
          country: null,
          age: null,
          gender: "MALE",
          userId: user.id,
          email: user.email || "",
          isUserOnly: true, // Flag to indicate this is a user without a player record
        };
        
        playerMap.set(syntheticPlayer.id, syntheticPlayer);
      }
    });
    
    // Convert the map to an array
    const allPlayers = Array.from(playerMap.values());
    
    // Sort by name
    allPlayers.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      players: allPlayers,
      meta: {
        total: allPlayers.length,
        page,
        limit,
        totalPages: Math.ceil(allPlayers.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return errorHandler(error as Error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await authMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        {
          message: "Player name is required",
        },
        { status: 400 }
      );
    }

    // If email is provided, check if a user already exists with this email
    let userId = null;
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        // Use this user's ID for the player
        userId = existingUser.id;
        
        // Update user role to PLAYER if not already
        if (existingUser.role !== "PLAYER") {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: "PLAYER" },
          });
        }
      } else {
        // Create a new user with this email
        const newUser = await prisma.user.create({
          data: {
            email: data.email,
            username: data.name,
            role: "PLAYER",
            // Use a random password that will need to be reset
            password: Math.random().toString(36).substring(2, 15),
          },
        });
        userId = newUser.id;
      }
    }

    // Create new player
    const player = await prisma.player.create({
      data: {
        name: data.name,
        country: data.country || null,
        skillLevel: data.skillLevel || "B",
        age: data.age || null,
        gender: data.gender || "MALE",
        imageUrl: data.imageUrl || null,
        isActive: true,
        ...(userId ? { userId } : {}), // Link to user if we have a userId
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return errorHandler(error as Error, request);
  }
}
