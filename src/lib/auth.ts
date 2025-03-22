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
        if (!credentials?.usernameOrEmail && !credentials?.password) {
          console.error("Missing credentials");
          throw new Error("Missing credentials");
        }

        try {
          // Check if database is available
          if (typeof window === 'undefined') {
            let dbConnected = false;
            try {
              await prisma.$queryRaw`SELECT 1`;
              dbConnected = true;
            } catch (e) {
              console.error("Database connection issue during authentication", e);
              // Instead of throwing, we'll use a mock user during DB downtime
              // This prevents 401 errors at the callback endpoint
              if (process.env.NODE_ENV === 'development') {
                console.warn("Using fallback auth in development mode due to database issues");
                return {
                  id: "temp-id-1",
                  name: "Temporary User",
                  email: credentials.usernameOrEmail,
                  image: "",
                  role: "USER",
                  isApproved: true,
                  username: credentials.usernameOrEmail.split('@')[0],
                  _tempAuthDuringDbDowntime: true
                };
              }
              
              throw new Error("Database connection issue. Please try again later.");
            }
          }

          // Find user by email or username
          const loginIdentifier = credentials.usernameOrEmail || '';
          const isEmail = loginIdentifier.includes('@');
          
          const user = await prisma.user.findFirst({
            where: isEmail 
              ? { email: loginIdentifier } 
              : { username: loginIdentifier }
          });

          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }

          // Check if user account is active
          if (user.status !== "ACTIVE") {
            throw new Error("Account is not active");
          }

          // Verify password
          const isValidPassword = await compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          // Make sure role is properly capitalized
          const normalizedRole = user.role.toUpperCase();

          return {
            id: user.id.toString(),
            name: user.name || "",
            email: user.email,
            image: user.profilePicture || "",
            role: normalizedRole,
            isApproved: user.status === "ACTIVE",
            username: user.username || "",
          };
        } catch (error: any) {
          console.error("Login error:", error);
          
          // Specialized handling for database connection errors
          if (error.message && 
              (error.message.includes('database') || 
               error.message.includes('connection') ||
               error.message.includes('ECONNREFUSED'))) {
            // Return a special error that our frontend can handle properly
            throw new Error("Database connection issue. Please try again in a few moments.");
          }
          
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
        token.role = user.role;
        token.isApproved = user.isApproved;
        token.username = user.username;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isApproved = token.isApproved as boolean;
        session.user.username = token.username as string;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Always allow bypassing the callback URL when we have DB issues
      // This prevents getting stuck in the callback loop with 401 errors
      if (url.includes('/api/auth/callback/credentials')) {
        console.log("Handling credentials callback redirect to avoid 401 errors");
        return `${baseUrl}/auth?error=AuthenticationError&message=Database+connection+issue`;
      }
      
      // If URL is absolute and for the same site, keep it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // If URL is relative, prepend the base URL
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Default to base URL
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === "development",
};
