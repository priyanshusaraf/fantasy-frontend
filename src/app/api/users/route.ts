import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        role: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Creating user with data:", body);
    
    // Check if required fields are provided
    if (!body.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });
    
    if (existingUser) {
      console.log("User already exists:", existingUser);
      // Return the existing user instead of creating a new one
      return NextResponse.json(existingUser);
    }
    
    // Create a new user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username || body.email.split('@')[0],
        name: body.name || body.username || body.email.split('@')[0],
        role: body.role || "USER",
        status: "ACTIVE", // Set status directly
      },
    });
    
    console.log("Created new user:", user);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { 
        error: "Failed to create user", 
        message: error.message,
        details: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
