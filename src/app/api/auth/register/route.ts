import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

// Use singleton pattern for PrismaClient to prevent connection issues
import prisma from "@/lib/prisma";

// Define validation schema for registration
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.string().default("USER"),
  skillLevel: z.string().optional(),
});

// Fallback function for development only
async function saveUserLocally(userData: any) {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const filePath = path.join(process.cwd(), 'temp-users.json');
      let users = [];
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        users = JSON.parse(fileContent);
      }
      
      users.push({
        ...userData,
        id: users.length + 1,
        createdAt: new Date().toISOString()
      });
      
      fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
      console.log(`User saved locally at ${filePath}`);
      return true;
    } catch (error) {
      console.error('Failed to save user locally:', error);
      return false;
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    console.log("Registration API called");
    
    // Set CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Test database connection with explicit settings
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      );
      
      const connectionPromise = prisma.$connect();
      
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      
      // In production, return a user-friendly error
      return NextResponse.json(
        { 
          error: "Temporary database connection issue. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
        },
        { status: 503, headers }
      );
    }
    
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed:", { 
        username: body.username, 
        email: body.email,
        role: body.role 
      });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", details: String(parseError) },
        { status: 400, headers }
      );
    }
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400, headers }
      );
    }
    
    const { username, email, password, role, skillLevel } = validationResult.data;
    console.log(`Validated registration data: ${email}, role: ${role}`);

    // Check if user already exists - more thorough check with both email and username
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        console.log(`User already exists with email: ${email} or username: ${username}`);
        if (existingUser.email === email) {
          return NextResponse.json(
            { error: "A user with this email already exists" },
            { status: 409, headers }
          );
        } else {
          return NextResponse.json(
            { error: "A user with this username already exists" },
            { status: 409, headers }
          );
        }
      }
    } catch (findError) {
      console.error("Error checking existing user:", findError);
      return NextResponse.json(
        { error: "Failed to check existing user", details: String(findError) },
        { status: 500, headers }
      );
    }

    // Hash password
    let hashedPassword;
    try {
      console.log(`Hashing password for user: ${email}`);
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return NextResponse.json(
        { error: "Failed to process password", details: String(hashError) },
        { status: 500, headers }
      );
    }

    console.log(`Starting user creation transaction for: ${email}, role: ${role}`);
    
    // Use transaction to ensure all related records are created or nothing is created
    try {
      const newUser = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role,
            status: "ACTIVE", 
            name: username, // Set name field for consistent data structure
          },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        });
        
        console.log(`User record created with ID: ${user.id}`);
        
        // Create account record for credentials
        await tx.account.create({
          data: {
            userId: user.id,
            type: "credentials",
            provider: "credentials",
            providerAccountId: email,
          }
        });
        
        console.log(`Credentials account created for user: ${user.id}`);

        // If user is a PLAYER, create player profile with skill level
        if (role === "PLAYER") {
          if (!skillLevel) {
            throw new Error("Skill level is required for player accounts");
          }
          
          console.log(`Creating player profile for user: ${user.id}`);
          await tx.player.create({
            data: {
              userId: user.id,
              name: username, // Use username as the player name
              skillLevel: skillLevel as any,
              isActive: true,
            },
          });
          console.log(`Player profile created for user: ${user.id}`);
        }
        
        // If user is a REFEREE, create referee profile with default certification level
        if (role === "REFEREE") {
          console.log(`Creating referee profile for user: ${user.id}`);
          await tx.referee.create({
            data: {
              userId: user.id,
              certificationLevel: "BASIC", // Default certification level for new referees
            },
          });
          console.log(`Referee profile created for user: ${user.id}`);
        }
        
        // Create wallet for all users
        await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
          }
        });
        
        console.log(`Wallet created for user: ${user.id}`);
        
        return user;
      });

      console.log(`User registration completed successfully:`, {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      return NextResponse.json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
        },
      }, { headers });
    } catch (transactionError: any) {
      console.error("Transaction error details:", transactionError);
      
      // Provide more specific error messages for different error types
      if (transactionError instanceof Prisma.PrismaClientKnownRequestError) {
        if (transactionError.code === 'P2002') {
          const target = transactionError.meta?.target as string[];
          if (target) {
            const field = target[0];
            return NextResponse.json(
              { error: `A user with this ${field} already exists` },
              { status: 409, headers }
            );
          }
          return NextResponse.json(
            { error: "A user with this email or username already exists" },
            { status: 409, headers }
          );
        }
        
        // Handle foreign key constraint errors
        if (transactionError.code === 'P2003') {
          return NextResponse.json(
            { error: "Registration failed due to a database constraint error", details: JSON.stringify(transactionError.meta) },
            { status: 500, headers }
          );
        }
      }
      
      // Handle custom errors
      if (transactionError.message === "Skill level is required for player accounts") {
        return NextResponse.json(
          { error: transactionError.message },
          { status: 400, headers }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Registration failed. Please try again.", 
          details: transactionError.message,
          stack: process.env.NODE_ENV === 'development' ? transactionError.stack : undefined
        },
        { status: 500, headers }
      );
    }
  } catch (error: any) {
    console.error("Unhandled registration error:", error);
    
    // Set CORS headers for error response
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred during registration", 
        details: String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500, headers }
    );
  } finally {
    // Ensure DB connection is closed properly
    await prisma.$disconnect();
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
