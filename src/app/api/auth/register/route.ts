import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json();

    // Before creating, check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Only allow duplicate emails if the roles are different
    if (existingUser) {
      if (existingUser.role === role) {
        return NextResponse.json(
          { error: "User with this email and role already exists" },
          { status: 400 }
        );
      } else {
        // Allow registration with same email for different role
        console.log(`Allowing registration with email ${email} for role ${role} (existing user has role ${existingUser.role})`);
      }
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
