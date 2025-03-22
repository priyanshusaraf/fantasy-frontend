// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { Adapter } from "next-auth/adapters";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";

/**
 * This is a completely custom adapter to work directly with our Prisma schema
 */
export function createPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // CREATE USER - Handle the 'image' to 'profileImage' mapping
    async createUser(data) {
      console.log("Creating new user from auth provider:", data);
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          profilePicture: data.image, // Map 'image' to 'profilePicture'
          emailVerified: data.emailVerified,
          role: "USER", // Default role
          status: "ACTIVE", // Use status field instead of isApproved
        },
      });

      console.log("Created user:", user);
      
      return {
        ...user,
        id: user.id.toString(),
        image: user.profilePicture, // Map back for NextAuth
        isApproved: user.status === "ACTIVE", // Map status to isApproved for backward compatibility
      };
    },

    // GET USER
    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) return null;

      return {
        ...user,
        id: user.id.toString(),
        image: user.profilePicture, // Map for NextAuth
        isApproved: user.status === "ACTIVE", // Map status to isApproved for backward compatibility
      };
    },

    // GET USER BY EMAIL
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      return {
        ...user,
        id: user.id.toString(),
        image: user.profilePicture, // Map for NextAuth
        isApproved: user.status === "ACTIVE", // Map status to isApproved for backward compatibility
      };
    },

    // GET USER BY ACCOUNT
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });

      if (!account) return null;

      const { user } = account;

      return {
        ...user,
        id: user.id.toString(),
        image: user.profilePicture, // Map for NextAuth
        isApproved: user.status === "ACTIVE", // Map status to isApproved for backward compatibility
      };
    },

    // UPDATE USER
    async updateUser(user) {
      const { id, image, isApproved, ...data } = user;

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          ...data,
          profilePicture: image, // Map for our DB
          status: isApproved ? "ACTIVE" : "PENDING", // Convert isApproved to status
        },
      });

      return {
        ...updatedUser,
        id: updatedUser.id.toString(),
        image: updatedUser.profilePicture, // Map for NextAuth
        isApproved: updatedUser.status === "ACTIVE", // Map status to isApproved for backward compatibility
      };
    },

    // LINK ACCOUNT
    async linkAccount(data) {
      const account = await prisma.account.create({
        data: {
          userId: parseInt(data.userId),
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token,
          access_token: data.access_token,
          expires_at: data.expires_at,
          token_type: data.token_type,
          scope: data.scope,
          id_token: data.id_token,
          session_state: data.session_state,
        },
      });

      return account;
    },

    // CREATE SESSION
    async createSession({ sessionToken, userId, expires }) {
      const session = await prisma.session.create({
        data: {
          sessionToken,
          userId: parseInt(userId),
          expires,
        },
      });

      return session;
    },

    // GET SESSION
    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (!session) return null;

      const { user } = session;

      return {
        session,
        user: {
          ...user,
          id: user.id.toString(),
          image: user.profilePicture, // Map for NextAuth
          isApproved: user.status === "ACTIVE", // Map status to isApproved for backward compatibility
        },
      };
    },

    // UPDATE SESSION
    async updateSession(data) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: {
          expires: data.expires,
        },
      });

      return session;
    },

    // DELETE SESSION
    async deleteSession(sessionToken) {
      await prisma.session.delete({
        where: { sessionToken },
      });
    },

    // CREATE VERIFICATION TOKEN
    async createVerificationToken(data) {
      const verificationToken = await prisma.verificationToken.create({
        data,
      });

      return verificationToken;
    },

    // USE VERIFICATION TOKEN
    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });

        return verificationToken;
      } catch (error) {
        // If token doesn't exist
        return null;
      }
    },

    // DELETE USER
    async deleteUser(userId) {
      await prisma.user.delete({
        where: { id: parseInt(userId) },
      });
    },

    // UNLOCK USER
    async unlinkAccount({ providerAccountId, provider }) {
      await prisma.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },
  };
}

// Type declarations for NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    isApproved: boolean;
    status?: string;
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      isApproved: boolean;
      username?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isApproved: boolean;
    username?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: createPrismaAdapter(prisma as PrismaClient),
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        usernameOrEmail: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.usernameOrEmail && !(credentials?.username || credentials?.email) || !credentials?.password) {
          console.error("Missing credentials: No username/email or password provided");
          throw new Error("Missing credentials");
        }

        try {
          // Check if database is available first
          if (typeof window === 'undefined') {
            try {
              await prisma.$queryRaw`SELECT 1`;
              console.log("Database connection verified");
            } catch (e) {
              console.error("Database not available during login:", e);
              throw new Error("Database connection issue. Please try again later.");
            }
          }

          // Handle different credential formats (accept both usernameOrEmail and username/email)
          const loginIdentifier = credentials.usernameOrEmail || credentials.username || credentials.email || '';
          console.log(`Login attempt with identifier: ${loginIdentifier.includes('@') ? 'email format' : 'username format'}`);
          
          // Check if the input is an email or username
          const isEmail = loginIdentifier.includes('@');
          
          // Find user by email or username
          const user = await prisma.user.findFirst({
            where: isEmail 
              ? { email: loginIdentifier } 
              : { username: loginIdentifier }
          });

          console.log(`User lookup result: ${user ? `Found (ID: ${user.id}, Role: ${user.role})` : 'Not found'}`);

          if (!user || !user.password) {
            console.error(`Authentication failed: ${!user ? 'User not found' : 'Password not set'}`);
            throw new Error("Invalid credentials");
          }

          // Check if user account is active
          if (user.status !== "ACTIVE") {
            console.error(`Authentication failed: Account status is ${user.status}`);
            throw new Error("Account is not active");
          }

          // Verify password
          const isValidPassword = await compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            console.error("Authentication failed: Invalid password");
            throw new Error("Invalid credentials");
          }

          console.log(`Authentication successful for ${user.role} user (ID: ${user.id})`);
          
          // Force-set role to "PLAYER" for users with player role to ensure consistency
          if (user.role === "player" || user.role === "PLAYER") {
            user.role = "PLAYER";
          }

          return {
            id: user.id.toString(),
            name: user.name || "",
            email: user.email,
            image: user.profilePicture || "",
            role: user.role,
            isApproved: user.status === "ACTIVE",
            username: user.username || "",
          };
        } catch (error: any) {
          console.error("Login error:", error);
          throw error;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Add profile to get additional data like name and image
      profile(profile) {
        return {
          id: profile.sub.toString(),
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "USER",
          isApproved: true,
          username: profile.email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
    // Keep users logged in for a year
    maxAge: 365 * 24 * 60 * 60, // 365 days
  },
  // Set long cookie expiration
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60, // 365 days
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Ensure role is always set with USER as fallback
        token.role = user.role || "USER";
        token.isApproved = user.isApproved;
        token.username = user.username;
      }
      // Handle case where token exists but role is missing
      if (!token.role) {
        token.role = "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // Ensure role is always set with USER as fallback 
        session.user.role = (token.role as string) || "USER";
        session.user.isApproved = token.isApproved as boolean;
        session.user.username = token.username as string;
      }
      // Double-check role is set
      if (session.user && !session.user.role) {
        session.user.role = "USER";
      }
      return session;
    },
    // Add custom redirect callback to always go to user dashboard for credentials provider
    async redirect({ url, baseUrl }) {
      // If URL is absolute and for same site
      if (url.startsWith(baseUrl)) {
        // For credentials provider success login, always go to user dashboard
        if (url.includes('/api/auth/callback/credentials')) {
          return `${baseUrl}/user/dashboard`;
        }
        // For other authorized callbacks, keep the URL
        return url;
      }
      // If URL is relative, prepend base URL
      else if (url.startsWith('/')) {
        // For credentials login, ensure we go to user dashboard
        if (url === '/' || url === '/dashboard') {
          return `${baseUrl}/user/dashboard`;
        }
        return `${baseUrl}${url}`;
      }
      // Otherwise, return to base URL
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === "development",
};
