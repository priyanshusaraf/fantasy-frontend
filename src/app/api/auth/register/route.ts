import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

// Define validation schema for registration
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.string().default("USER"),
  skillLevel: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.format());
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { username, email, password, role, skillLevel } = validationResult.data;

    // Check if user already exists - more thorough check with both email and username
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
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: "A user with this username already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password
    console.log(`Hashing password for user: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`Starting user creation transaction for: ${email}, role: ${role}`);
    
    // Use transaction to ensure all related records are created or nothing is created
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
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Provide more specific error messages for different error types
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target) {
          const field = target[0];
          return NextResponse.json(
            { error: `A user with this ${field} already exists` },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "A user with this email or username already exists" },
          { status: 409 }
        );
      }
      
      // Handle foreign key constraint errors
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: "Registration failed due to a database constraint error" },
          { status: 500 }
        );
      }
    }
    
    // Handle custom errors
    if (error.message === "Skill level is required for player accounts") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Registration failed. Please try again.", details: error.message },
      { status: 500 }
    );
  }
}
