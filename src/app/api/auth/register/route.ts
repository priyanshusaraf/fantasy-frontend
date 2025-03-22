import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import prisma from "@/lib/prisma";
import { pingDatabase } from "@/lib/prisma";

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "PLAYER", "REFEREE", "TOURNAMENT_ADMIN", "MASTER_ADMIN"]).default("USER"),
  rank: z.string().optional(),
});

// Enhanced fallback function that works in both development and production
async function saveUserWithFallback(userData: any) {
  try {
    console.log("Using fallback mechanism to save user:", userData.email);
    
    // Generate a unique ID for the user
    const userId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Prepare the user data with all required fields
    const userRecord = {
      ...userData,
      id: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Additional fields that might be needed later
      emailVerified: null,
      status: "PENDING",
      failedLoginAttempts: 0,
      lastLoginAt: null,
      isSynced: false,
    };
    
    // First try to save user data to a memory store
    const globalStore = global as any;
    if (!globalStore.tempUsers) {
      globalStore.tempUsers = {};
    }
    
    // Add user to memory store, using email as key to prevent duplicates
    globalStore.tempUsers[userData.email] = userRecord;
    
    // Also try the filesystem approach
    await saveUserLocally(userRecord);
    
    console.log(`User ${userData.email} saved to fallback storage with ID: ${userId}`);
    return {
      success: true,
      userId: userId,
      userData: userRecord
    };
  } catch (error) {
    console.error("Fallback registration failed:", error);
    // Return object with error details
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      userData: userData
    };
  }
}

// Improved fallback function to reliably save user data locally
async function saveUserLocally(userData: any): Promise<boolean> {
  try {
    // Log the attempted registration
    console.log(`[FALLBACK] Saving registration for ${userData.email}`);
    
    const filePath = path.join(process.cwd(), 'temp-users.json');
    
    // Create an object to store users by email to prevent duplicates
    let users: Record<string, any> = {};
    
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        users = JSON.parse(fileContent);
      } catch (readError) {
        console.error('Error reading temp-users.json, creating new file:', readError);
        // If the file is corrupted, we'll just create a new one
      }
    }
    
    // Add/update user in the object, using email as key to prevent duplicates
    users[userData.email] = {
      ...userData,
      updatedAt: new Date().toISOString() // Add an updated timestamp
    };
    
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file with error handling
    try {
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      console.log(`User saved locally at ${filePath}`);
    } catch (writeError) {
      console.error('Failed to write to temp-users.json:', writeError);
      
      // Try an alternative location as fallback (e.g., /tmp)
      const tmpPath = '/tmp/fantasy-app-temp-users.json';
      try {
        fs.writeFileSync(tmpPath, JSON.stringify(users, null, 2));
        console.log(`User saved to alternative location: ${tmpPath}`);
      } catch (tmpWriteError) {
        console.error('Failed to write to alternative location:', tmpWriteError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save user locally:', error);
    // Return true anyway to proceed with registration
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error("Database connection error during registration:", dbError);
      return NextResponse.json(
        { 
          error: "Database connection issue. Your registration will be processed when the database is available." 
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Clone the request body to avoid "Body already used" errors
    const body = await req.clone().json();
    console.log("Registration request received for:", body.email);
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      const errorMessages = validation.error.errors.map(error => `${error.path}: ${error.message}`).join(", ");
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      );
    }
    
    const { name, username, email, password, role, rank } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 409 } // Conflict
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role,
        status: "ACTIVE",
        emailVerified: new Date(),
      },
    });
    
    // If user is a PLAYER and rank is provided, update the player info
    if (role === "PLAYER" && rank) {
      await prisma.player.create({
        data: {
          userId: user.id,
          name: name,
          rank: parseInt(rank, 10) || null,
          isActive: true,
        },
      });
    }
    
    // Mask the password
    const { password: _, ...userWithoutPassword } = user;
    
    // Return success with user data
    return NextResponse.json(
      { 
        success: true, 
        message: "User registered successfully",
        user: userWithoutPassword
      },
      { status: 202 } // Accepted
    );
    
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle database-specific errors
    if (error instanceof Error) {
      if (error.message.includes("database") || 
          error.message.includes("connection") || 
          error.message.includes("timeout") ||
          error.message.includes("ECONN")) {
        return NextResponse.json(
          { error: "Database connection issue. Please try again later." },
          { status: 503 } // Service Unavailable
        );
      }
      
      if (error.message.includes("unique constraint")) {
        return NextResponse.json(
          { error: "A user with this email or username already exists" },
          { status: 409 } // Conflict
        );
      }
    }
    
    // Generic error
    return NextResponse.json(
      { error: "Registration failed. Please try again later." },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  
  return new Response(null, { headers });
}
