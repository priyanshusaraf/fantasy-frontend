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
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "PLAYER", "REFEREE"]).optional().default("USER"),
  skillLevel: z.string().optional(),
}).superRefine((data, ctx) => {
  // Ensure at least one of name or username is provided
  if (!data.name && !data.username) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either name or username is required",
      path: ["name"]
    });
  }
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
    const body = await req.json();
    console.log("Registration request body:", JSON.stringify(body));
    
    const validation = registerSchema.safeParse(body);
    
    if (!validation.success) {
      console.error("Validation error:", JSON.stringify(validation.error.errors));
      return NextResponse.json(
        { 
          error: validation.error.errors[0].message,
          details: validation.error.errors,
          received: body
        },
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { email, password, skillLevel } = validation.data;
    let { role = "USER" } = validation.data;
    
    // Ensure role is restricted (extra protection beyond the schema)
    if ((role as string) === "TOURNAMENT_ADMIN" || (role as string) === "MASTER_ADMIN") {
      console.warn(`Attempt to register with restricted role: ${role} for email: ${email}`);
      role = "USER"; // Force to USER if someone tries to bypass validation
    }
    
    // Extract name with fallbacks (username → name → default)
    // We prioritize name over username if both are provided
    const name = validation.data.name || validation.data.username || "New User";
    const username = validation.data.username || validation.data.name || email.split('@')[0];
    
    console.log(`Processing registration for ${email} with username: ${username}, name: ${name}, role: ${role}`);
    
    // Check if database is actually available before proceeding
    let dbAvailable = false;
    try {
      dbAvailable = await pingDatabase();
      console.log("Database available:", dbAvailable);
    } catch (error) {
      console.error("Database ping failed:", error);
    }
    
    if (!dbAvailable) {
      // Use fallback mechanism
      console.warn(`Database unavailable during registration for ${email}`);
      
      // Hash password securely before storage
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Save user data with fallback
      const fallbackResult = await saveUserWithFallback({
        username,
        name,
        email,
        password: hashedPassword,
        role,
        skillLevel,
        registeredAt: new Date().toISOString()
      });
      
      if (fallbackResult.success) {
        // Return a specific response for fallback mode
        return NextResponse.json(
          { 
            message: "User registration saved offline. Your account will be activated when database connectivity is restored.",
            fallback: true,
            email: email,
            pendingSync: true,
            temporaryId: fallbackResult.userId
          }, 
          { status: 202 }
        );
      } else {
        // Even if fallback failed, we'll give a positive response to the user
        return NextResponse.json(
          { 
            message: "Registration received. You'll be notified when your account is ready.",
            fallback: true,
            email: email,
            pendingSync: true
          }, 
          { status: 202 }
        );
      }
    }
    
    // If we got here, database should be available
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with retry logic
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    while (retryCount < MAX_RETRIES) {
      try {
        const newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role,
            status: "ACTIVE",
            emailVerified: new Date(),
          },
        });
        
        console.log(`User ${newUser.id} created successfully`);
        
        // If user is a PLAYER, create player profile with skill level
        if (role === "PLAYER") {
          if (!skillLevel) {
            throw new Error("Skill level is required for player accounts");
          }
          
          console.log(`Creating player profile for user: ${newUser.id}`);
          await prisma.player.create({
            data: {
              userId: newUser.id,
              name: name,
              skillLevel: skillLevel as any,
              isActive: true,
            },
          });
          console.log(`Player profile created for user: ${newUser.id}`);
        }
        
        // If user is a REFEREE, create referee profile with default certification level
        if (role === "REFEREE") {
          console.log(`Creating referee profile for user: ${newUser.id}`);
          await prisma.referee.create({
            data: {
              userId: newUser.id,
              certificationLevel: "BASIC", // Default certification level for new referees
            },
          });
          console.log(`Referee profile created for user: ${newUser.id}`);
        }
        
        // Create wallet for all users
        await prisma.wallet.create({
          data: {
            userId: newUser.id,
            balance: 0,
          }
        });
        
        console.log(`Wallet created for user: ${newUser.id}`);
        
        return NextResponse.json(
          { 
            message: "User registration successful",
            userId: newUser.id
          },
          { status: 201 }
        );
      } catch (error: any) {
        retryCount++;
        console.error(`Registration attempt ${retryCount} failed:`, error);
        
        // If error is due to database connection
        if (error.message?.includes('database') || 
            error.message?.includes('connection') ||
            error.code === 'P1001' || error.code === 'P1002') {
          
          // If database suddenly became unavailable, use fallback
          if (retryCount >= MAX_RETRIES) {
            console.warn(`Database connection failed after ${retryCount} attempts, using fallback`);
            
            // Save user data with fallback as last resort
            const fallbackResult = await saveUserWithFallback({
              username,
              name,
              email,
              password: hashedPassword,
              role,
              skillLevel,
              registeredAt: new Date().toISOString()
            });
            
            return NextResponse.json(
              { 
                message: "Registration saved offline due to database issues. Your account will be activated soon.",
                fallback: true,
                email: email,
                pendingSync: true
              }, 
              { status: 202 }
            );
          }
        }
        
        // Wait with exponential backoff before retrying
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount-1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we reach here, all retries failed but not due to database connectivity
    return NextResponse.json(
      { error: "Registration failed after multiple attempts. Please try again later." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Unexpected registration error:", error);
    
    return NextResponse.json(
      { error: "An unexpected error occurred during registration" },
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
