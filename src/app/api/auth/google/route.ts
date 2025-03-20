import { NextRequest, NextResponse } from "next/server";
import { googleOAuthService } from "@/lib/oauth";
import { UserService } from "@/lib/user-service";
import { signJwtToken } from "@/lib/jwt";

export async function GET() {
  // Generate Google OAuth URL
  const authUrl = googleOAuthService.generateAuthUrl();
  return NextResponse.redirect(authUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { message: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokens = await googleOAuthService.getTokens(code);

    // Verify the ID token
    const userInfo = await googleOAuthService.verifyIdToken(tokens.id_token);
    if (!userInfo) {
      return NextResponse.json(
        { message: "Failed to verify Google user" },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(userInfo.email);

    let userId: number;
    if (!existingUser) {
      // For a brand-new user, include all required fields
      userId = await UserService.createUser({
        username: userInfo.name,
        email: userInfo.email,
        password: null,
        role: "USER",
        profileImage: userInfo.picture,
        isApproved: false, // required by your model
      });
    } else {
      // Use the non-null assertion operator (!) if you're sure 'id' is defined
      userId = existingUser.id!;
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate JWT
    const token = signJwtToken({
      id: user.id || 0,
      email: user.email,
      role: user.role || "USER",
    });

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
