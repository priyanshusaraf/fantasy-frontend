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

    // Prepare user data
    const userData = {
      username,
      email,
      password: hashedPassword,
      role,
      status: "ACTIVE", 
      name: username, // Set name field for consistent data structure
    };

    console.log(`Creating user with email: ${email}, role: ${role}`);
    
    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        status: true,
        password: true, // Only to confirm it was saved
      },
    });

    // Mask the password before logging
    const userLog = {...user, password: user.password ? 'REDACTED' : null};
    console.log(`User created successfully:`, userLog);

    try {
      // If user is a PLAYER, create player profile with skill level
      if (role === "PLAYER" && skillLevel) {
        console.log(`Creating player profile for user: ${user.id}`);
        await prisma.player.create({
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
        await prisma.referee.create({
          data: {
            userId: user.id,
            certificationLevel: "BASIC", // Default certification level for new referees
          },
        });
        console.log(`Referee profile created for user: ${user.id}`);
      }
    } catch (roleError) {
      // If role-specific creation fails, we'll still have the user created
      console.error("Error creating role-specific profile:", roleError);
      // We could delete the user here, but allowing partial registration might be better
      // The user will still be able to log in and complete their profile later
    }

    // Double check that the user was created properly
    const savedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        email: true, 
        username: true, 
        name: true,
        role: true,
        status: true,
        password: true // Only for verification
      }
    });
    
    // Confirm the user exists with password
    if (!savedUser) {
      console.error("User not found after creation");
      return NextResponse.json(
        { error: "Failed to create user properly" },
        { status: 500 }
      );
    }
    
    console.log(`Verified user exists:`, {...savedUser, password: savedUser.password ? 'HASHED_PASSWORD_EXISTS' : 'NO_PASSWORD'});

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "A user with this email or username already exists" },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
