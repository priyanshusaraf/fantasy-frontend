import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createCustomAdapter } from "./custom-adapter";
import { env } from "@/lib/env";
import prisma, { pingDatabase, isDatabaseAvailable } from "@/lib/prisma"; // Import singleton prisma client and connectivity functions
import bcrypt from "bcryptjs";
import fs from 'fs';
import path from 'path';
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Define extended types for session and token
interface ExtendedUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  role?: string;
  username?: string;
}

interface ExtendedJWT extends JWT {
  user?: ExtendedUser;
  role?: string;
  username?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  isFallbackUser?: boolean;
}

interface ExtendedSession extends Session {
  user: ExtendedUser;
}

// Handle fallback auth for temporary users stored during database outages
async function checkFallbackUsers(email: string, password: string): Promise<any> {
  try {
    // Check temporary users stored in filesystem
    const filePath = path.join(process.cwd(), 'temp-users.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const users = JSON.parse(fileContent);
      
      // Find user by email
      const user = users[email];
      if (user) {
        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          console.log(`Authenticated user ${email} from fallback storage`);
          
          // Return minimal user object for authentication
          return {
            id: user.id || `temp_${Date.now()}`,
            email: user.email,
            name: user.name || user.username || email.split('@')[0],
            role: user.role || 'USER',
            isAdmin: false, // Fallback users are never admins
            isActive: true,
            isFallbackUser: true, // Flag to indicate this is a temporary user
          };
        }
      }
    }
    
    // Check in-memory store as well
    const globalStore = global as any;
    if (globalStore.tempUsers && globalStore.tempUsers[email]) {
      const user = globalStore.tempUsers[email];
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        console.log(`Authenticated user ${email} from in-memory fallback storage`);
        
        return {
          id: user.id || `temp_${Date.now()}`,
          email: user.email,
          name: user.name || user.username || email.split('@')[0],
          role: user.role || 'USER',
          isAdmin: false,
          isActive: true,
          isFallbackUser: true,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error checking fallback users:", error);
    return null;
  }
}

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
            isConnected = await pingDatabase();
            
            if (!isConnected) {
              console.error("Database connection is unavailable during login attempt");
              
              // Try fallback authentication for users registered during outage
              const fallbackUser = await checkFallbackUsers(credentials.email, credentials.password);
              if (fallbackUser) {
                return fallbackUser;
              }
              
              throw new Error("Database connection issue. Please try again later.");
            }
          } catch (connError) {
            console.error("Database connectivity check failed:", connError);
            
            // Try fallback authentication before giving up
            const fallbackUser = await checkFallbackUsers(credentials.email, credentials.password);
            if (fallbackUser) {
              return fallbackUser;
            }
            
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
            // One more check of fallback users if normal DB lookup fails
            const fallbackUser = await checkFallbackUsers(credentials.email, credentials.password);
            if (fallbackUser) {
              return fallbackUser;
            }
            
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
            role: user.role || 'USER',
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
            isAdmin: (user as any).isAdmin || false,
            isActive: (user as any).isActive || false,
            role: (user as any).role || 'USER',
          };
          
          // Add special flag for fallback users
          if ((user as any).isFallbackUser) {
            token.isFallbackUser = true;
          }
        }
        
        // Only try to get user status if we have a token with user info and database is available
        if (token.user?.id && !token.isFallbackUser && isDatabaseAvailable()) {
          try {
            // Set a timeout for the database query
            const userPromise = prisma.user.findUnique({
              where: { id: token.user.id },
              select: { isActive: true, isAdmin: true, role: true }
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
              
              // Update role
              if (userStatus.role) {
                token.user.role = userStatus.role;
              }
            }
          } catch (error) {
            // Log but continue - don't fail authentication if DB fetch fails
            console.error("Failed to update user status in JWT:", error);
            // Keep existing token values
          }
        }
        
        return token as ExtendedJWT;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return the token without modification in case of errors
        return token as ExtendedJWT;
      }
    },
    
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      const extendedSession = session as ExtendedSession;
      
      if (extendedSession.user) {
        // Set user ID from token
        extendedSession.user.id = extendedToken.user?.id || extendedToken.sub || '';
        
        // Copy all user properties from token to session
        if (extendedToken.user) {
          Object.assign(extendedSession.user, extendedToken.user);
        }
        
        // Add legacy custom fields if they exist directly on token
        if ('role' in extendedToken) extendedSession.user.role = extendedToken.role;
        if ('username' in extendedToken) extendedSession.user.username = extendedToken.username;
        if ('isAdmin' in extendedToken) extendedSession.user.isAdmin = extendedToken.isAdmin;
        if ('isActive' in extendedToken) extendedSession.user.isActive = extendedToken.isActive;
        
        // Add fallback flag if present
        if (extendedToken.isFallbackUser) {
          (extendedSession as any).isFallbackUser = true;
          extendedSession.user.isAdmin = false; // Ensure fallback users are never admins
        }
      }
      return extendedSession;
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
      
      // If this is a fallback user and database is now available, try to sync
      if ((message.user as any).isFallbackUser && isDatabaseAvailable()) {
        try {
          console.log(`Attempting to sync fallback user ${message.user.email} to database`);
          // Logic for syncing could be added here
        } catch (error) {
          console.error(`Failed to sync fallback user ${message.user.email}:`, error);
        }
      }
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