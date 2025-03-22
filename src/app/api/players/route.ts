// src/app/api/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/error-handler";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { SKILL_LEVELS } from "@/utils/constants";

// Update the schema to include more flexible skill level handling
const playerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  skillLevel: z.string().optional().default("B"),
  country: z.string().optional().nullable(),
  age: z.number().optional().nullable(),
  gender: z.string().optional().default("MALE"),
  imageUrl: z.string().optional().nullable(),
  email: z.string().email().optional(),
  password: z.string().optional()
});

// Extended schema that includes generated password for response
type PlayerWithPassword = z.infer<typeof playerSchema> & {
  generatedPassword?: string;
};

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

    try {
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
      standalonePlayers.forEach((player: any) => {
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
      playerUsers.forEach((user: any) => {
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
    } catch (dbError: unknown) {
      console.error("Database error fetching players:", dbError);
      return NextResponse.json({ 
        error: "Database error", 
        message: "Failed to fetch players from database",
        details: process.env.NODE_ENV === "development" ? (dbError as Error).message : undefined
      }, { status: 500 });
    }
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

    // Clone the request before trying to parse JSON to avoid stream errors
    const requestClone = request.clone();
    
    // First check if body exists and is not empty
    const text = await requestClone.text();
    if (!text || text.trim() === '') {
      console.error("Empty request body received");
      return NextResponse.json({
        error: "Invalid request",
        message: "Request body is empty or missing",
      }, { status: 400 });
    }

    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonError: unknown) {
      console.error("JSON parse error in players POST:", jsonError);
      return NextResponse.json({
        error: "Invalid request",
        message: "Could not parse request body as JSON. Check syntax and formatting.",
        details: process.env.NODE_ENV === "development" ? (jsonError as Error).message : undefined
      }, { status: 400 });
    }

    // Validate with Zod schema
    try {
      const validatedData = playerSchema.safeParse(data);
      if (!validatedData.success) {
        console.error("Validation error:", validatedData.error);
        return NextResponse.json({
          error: "Validation failed",
          message: "Invalid player data",
          details: process.env.NODE_ENV === "development" ? validatedData.error.format() : undefined
        }, { status: 400 });
      }
      data = validatedData.data;
    } catch (validationError) {
      console.error("Unexpected validation error:", validationError);
      return NextResponse.json({
        error: "Validation failed",
        message: "Invalid player data structure",
        details: process.env.NODE_ENV === "development" ? validationError : undefined
      }, { status: 400 });
    }

    // Check required fields
    if (!data.name) {
      console.error("Missing required field: name");
      return NextResponse.json({
        error: "Validation Error",
        message: "Player name is required"
      }, { status: 400 });
    }

    // If email is provided, check if a user already exists with this email
    let userId = null;
    try {
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
          // Generate a password if none provided
          const password = data.password || Math.random().toString(36).substring(2, 10);
          
          // Hash the password
          let hashedPassword;
          try {
            const bcrypt = require('bcryptjs');
            hashedPassword = await bcrypt.hash(password, 10);
          } catch (err) {
            console.error("Error hashing password:", err);
            hashedPassword = null; // If bcrypt fails, we'll store null password
          }
          
          // Create a new user with this email
          const newUser = await prisma.user.create({
            data: {
              email: data.email,
              username: data.name,
              role: "PLAYER",
              password: hashedPassword,
            },
          });
          userId = newUser.id;
          
          // Store original plain password temporarily for response
          // IMPORTANT: This should only be returned once during account creation
          data.generatedPassword = data.password ? undefined : password;
        }
      }

      // Create new player with proper data preparation
      const playerData = {
        name: data.name,
        country: data.country || null,
        skillLevel: data.skillLevel || "B",
        age: data.age || null,
        gender: data.gender || "MALE",
        imageUrl: data.imageUrl || null,
        isActive: true,
        ...(userId ? { userId } : {}), // Link to user if we have a userId
      };

      console.log("Creating player with data:", JSON.stringify(playerData));
      
      const player = await prisma.player.create({
        data: playerData,
      });

      console.log("Player created successfully:", player.id);

      // Include the temporary password in the response if one was generated
      const response = {
        ...player,
        email: data.email,
        generatedPassword: data.generatedPassword,
      };

      return NextResponse.json(response, { status: 201 });
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json({
        error: "Database Error",
        message: "Failed to create player in database",
        details: process.env.NODE_ENV === "development" ? (dbError as Error).message : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating player:", error);
    return errorHandler(error as Error, request);
  }
}
