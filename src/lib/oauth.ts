// src/lib/oauth.ts
import { OAuth2Client } from "google-auth-library";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
}

export class GoogleOAuthService {
  private client: OAuth2Client;

  constructor() {
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REDIRECT_URI
    ) {
      throw new Error("Missing Google OAuth configuration");
    }

    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  generateAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);
    return tokens;
  }

  async verifyIdToken(idToken?: string | null): Promise<GoogleUserInfo | null> {
    if (!idToken) return null;

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) return null;

      return {
        id: payload["sub"] || "",
        email: payload["email"] || "",
        name: payload["name"] || "",
        picture: payload["picture"] || null,
      };
    } catch (error) {
      console.error("Google token verification failed:", error);
      return null;
    }
  }
}

// Explicitly export the service instance
export const googleOAuthService = new GoogleOAuthService();
