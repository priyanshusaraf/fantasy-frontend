import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createCustomAdapter } from "./custom-adapter";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma"; // Import singleton prisma client
import bcrypt from "bcryptjs";
import fs from 'fs';
import path from 'path';

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  adapter: createCustomAdapter(),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with the same email
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Check database connection first
          let isConnected = false;
          try {
            // Import pingDatabase function from prisma.ts
            const { pingDatabase } = await import('@/lib/prisma');
            isConnected = await pingDatabase();
            
            if (!isConnected) {
              console.error("Database connection is unavailable during login attempt");
              throw new Error("Database connection issue. Please try again later.");
            }
          } catch (connError) {
            console.error("Database connectivity check failed:", connError);
            throw new Error("Database connection issue. Please try again later.");
          }
          
          // Get the user from database with timeout protection
          const userPromise = prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });
          
          // Set a timeout for the database query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Database request timed out")), 10000);
          });
          
          // Race the user query against the timeout
          const user = await Promise.race([userPromise, timeoutPromise]) as any;
          
          if (!user) {
            throw new Error("User not found with the provided email");
          }
    
          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordMatch) {
            throw new Error("Invalid password");
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isAdmin: user.isAdmin,
            isActive: user.isActive,
          };
          
        } catch (error: any) {
          console.error("Authentication error:", error);
          
          // Provide user-friendly error messages based on the error type
          if (error.message.includes("database") || error.message.includes("timed out") || 
              error.message.includes("connect") || error.message.includes("prisma")) {
            throw new Error("Database connection issue. Please try again later.");
          } else if (error.message.includes("password")) {
            throw new Error("Invalid credentials");
          } else if (error.message.includes("not found")) {
            throw new Error("Invalid credentials");
          } else {
            throw new Error("Authentication failed. Please try again.");
          }
        }
      }
    })
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.user = {
            id: user.id,
            email: user.email,
            name: user.name || '',
            image: user.image || '',
            isAdmin: user.isAdmin || false,
            isActive: user.isActive || false,
          };
        }
        
        // Only try to get user status if we have a token with user info
        if (token.user?.id) {
          try {
            // Set a timeout for the database query
            const userPromise = prisma.user.findUnique({
              where: { id: token.user.id },
              select: { isActive: true, isAdmin: true }
            });
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Database request timed out")), 5000);
            });
            
            // Race the database query against the timeout
            const userStatus = await Promise.race([userPromise, timeoutPromise]) as any;
            
            if (userStatus) {
              token.user.isActive = userStatus.isActive;
              
              // Only set as admin if their email is admin email
              const adminEmails = ['piku@gmail.com', 'admin@gmail.com'];
              if (adminEmails.includes(token.user.email)) {
                token.user.isAdmin = userStatus.isAdmin;
              } else {
                token.user.isAdmin = false;
              }
            }
          } catch (error) {
            // Log but continue - don't fail authentication if DB fetch fails
            console.error("Failed to update user status in JWT:", error);
            // Keep existing token values
          }
        }
        
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return the token without modification in case of errors
        return token;
      }
    },
    
    async session({ session, token }) {
      if (session.user) {
        console.log("Setting session from token:", { 
          id: (token as any).id,
          email: token.email
        });
        
        // Use type assertion to avoid TypeScript errors
        (session.user as any).id = (token as any).id;
        
        // Add custom user fields from JWT to session
        if ('role' in token) (session.user as any).role = (token as any).role;
        if ('username' in token) (session.user as any).username = (token as any).username;
        if ('status' in token) (session.user as any).status = (token as any).status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  // Make sure we never fail on auth operations by gracefully handling errors
  events: {
    async signIn(message) {
      // Log successful sign-ins
      console.log("User signed in:", message.user.email);
    },
    async signOut(message) {
      // Log sign-outs
      console.log("User signed out:", message.token?.email);
    },
    async createUser(message) {
      // Log user creation
      console.log("User created:", message.user.email);
    },
    async linkAccount(message) {
      // Log account linking
      console.log("Account linked for user:", message.user.email);
    },
    async session(message) {
      // Avoid excessive logging of session events
      if (Math.random() < 0.05) { // Log only ~5% of session events to reduce noise
        console.log("Session accessed for user:", message.session.user.email);
      }
    }
  },
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
};

export default authOptions; 