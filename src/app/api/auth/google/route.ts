// src/app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { googleOAuthService } from "@/lib/oauth";
import { UserService } from "@/lib/user-service";
import { generateToken } from "@/lib/jwt";

export async function GET() {
  // Generate Google OAuth URL
  const authUrl = googleOAuthService.generateAuthUrl();

  return NextResponse.redirect(authUrl);
}

export async function POST(request: NextRequest) {
  try {
    // Extract code from request body
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { message: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Get tokens
    const tokens = await googleOAuthService.getTokens(code);

    // Verify ID token
    const userInfo = await googleOAuthService.verifyIdToken(tokens.id_token);

    if (!userInfo) {
      return NextResponse.json(
        { message: "Failed to verify Google user" },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const existingUser = await UserService.findByEmail(userInfo.email);

    let userId: number;
    if (!existingUser) {
      userId = await UserService.createUser({
        username: userInfo.name,
        email: userInfo.email,
        password: null,
        role: "user",
        profileImage: userInfo.picture,
      });
    } else {
      userId = existingUser.id!;
    }

    // Fetch user to ensure we have the latest data
    const user = await UserService.getUserById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate JWT
    const token = generateToken({
      id: user.id!,
      email: user.email,
      role: user.role || "user",
    });

    // Return user info and token
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("Google OAuth error:", error);
    return NextResponse.json(
      {
        message: "Authentication failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
