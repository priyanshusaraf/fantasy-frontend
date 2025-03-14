// src/lib/auth/google-auth.ts
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../db";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google's user ID
}

enum UserRole {
  USER = "USER",
  PLAYER = "PLAYER",
  REFEREE = "REFEREE",
  TOURNAMENT_ADMIN = "TOURNAMENT_ADMIN",
  MASTER_ADMIN = "MASTER_ADMIN",
}

interface User {
  id?: number;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  googleId: string;
  isApproved: boolean;
  createdAt?: Date;
}

export async function verifyGoogleToken(
  token: string
): Promise<GoogleUser | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return null;

    return {
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture!,
      sub: payload.sub,
    };
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}

export async function authenticateWithGoogle(googleToken: string) {
  const connection = await connectToDatabase();

  try {
    // Verify Google token
    const googleUser = await verifyGoogleToken(googleToken);
    if (!googleUser) {
      throw new Error("Invalid Google token");
    }

    // Check if user exists
    const [existingUsers] = await connection.execute(
      "SELECT * FROM users WHERE googleId = ? OR email = ?",
      [googleUser.sub, googleUser.email]
    );

    let user: User;

    if (existingUsers && (existingUsers as any[]).length > 0) {
      // User exists, update profile
      user = (existingUsers as any[])[0];

      // Update profile image if changed
      if (user.profileImage !== googleUser.picture) {
        await connection.execute(
          "UPDATE users SET profileImage = ? WHERE id = ?",
          [googleUser.picture, user.id]
        );
      }
    } else {
      // Create new user with default role USER
      const [result] = await connection.execute(
        "INSERT INTO users (email, name, googleId, profileImage, role, isApproved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          googleUser.email,
          googleUser.name,
          googleUser.sub,
          googleUser.picture,
          UserRole.USER,
          true,
          new Date(),
        ]
      );

      const insertId = (result as any).insertId;

      // Fetch the newly created user
      const [newUsers] = await connection.execute(
        "SELECT * FROM users WHERE id = ?",
        [insertId]
      );

      user = (newUsers as any[])[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isApproved: user.isApproved,
      },
    };
  } catch (error) {
    console.error("Google authentication error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}
