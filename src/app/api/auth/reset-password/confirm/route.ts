import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyPasswordResetToken } from "@/lib/jwt";
import { z } from "zod";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Define validation schema
const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = resetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }
    
    const { token, password } = validationResult.data;

    // Verify token
    const tokenData = verifyPasswordResetToken(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Find user by id
    const user = await prisma.user.findUnique({
      where: { id: Number(tokenData.id) },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
} 