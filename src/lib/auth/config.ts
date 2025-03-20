import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createCustomAdapter } from "./custom-adapter";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma"; // Import singleton prisma client
import bcrypt from "bcryptjs";

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
        console.log("Authorize function called with credentials:", 
          credentials ? { email: credentials.email } : "No credentials");
          
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          throw new Error("Email and password are required");
        }

        try {
          // Find user by email
          console.log("Finding user with email:", credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          console.log("User found:", user ? { id: user.id, email: user.email, hasPassword: !!user.password } : "No user found");

          // Check if user exists and has a password
          if (!user) {
            throw new Error("User not found");
          }
          
          if (!user.password) {
            throw new Error("Password not set for this account. Try logging in with Google instead.");
          }

          // Verify password
          console.log("Verifying password...");
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          console.log("Password valid:", isPasswordValid);
          
          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          console.log("Authentication successful, returning user data");
          
          // Return a user object that matches NextAuth's expectations
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.username,
            image: user.image || user.profilePicture,
            role: user.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error; // Re-throw the error to display it to the user
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
      if (user) {
        console.log("Setting JWT from user:", { id: user.id, email: user.email });
        
        // Use type assertion to avoid TypeScript errors
        (token as any).id = user.id;
        
        // Add custom user fields from database to JWT
        if ('role' in user) (token as any).role = user.role;
        if ('username' in user) (token as any).username = user.username;
        
        // Get status from the database user
        if (user.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: parseInt(user.id.toString()) },
              select: { status: true }
            });
            if (dbUser?.status) {
              (token as any).status = dbUser.status;
            }
          } catch (error) {
            console.error("Error fetching user status:", error);
          }
        }
        
        // Restrict admin access to specific emails
        if (token.email === 'thematchupcompany@gmail.com' || token.email === 'your-second-email@example.com') {
          (token as any).role = 'MASTER_ADMIN';
        }
      }
      return token;
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
  debug: true, // Enable detailed debug logs
};

export default authOptions; 