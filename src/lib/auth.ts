// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { Adapter } from "next-auth/adapters";
import prisma from "@/lib/db";

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
  adapter: createPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "USER";
        // Use status field to determine approval
        token.isApproved = user.status === "ACTIVE" || user.isApproved || false;
        token.username = user.username || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isApproved = token.isApproved;
        session.user.username = token.username || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth?error=true",
    newUser: "/registration-callback",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
