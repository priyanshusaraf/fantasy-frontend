import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createCustomAdapter } from "./custom-adapter";
import { env } from "@/lib/env";
import { prisma, pingDatabase, isDatabaseAvailable } from "@/lib/prisma"; // Update to use named export
import bcrypt from "bcryptjs";
import fs from 'fs';
import path from 'path';
import { JWT } from "next-auth/jwt";
import { DefaultSession, Session } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      isAdmin?: boolean;
      isActive?: boolean;
      username?: string;
    }
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    isAdmin?: boolean;
    isActive?: boolean;
    role: string;
    username?: string;
    isFallbackUser?: boolean;
    status?: string;  // Add this field to match usage in the code
  }
}

// Extend JWT
declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      isAdmin?: boolean;
      isActive?: boolean;
      role?: string;
      username?: string;
    };
    isFallbackUser?: boolean;
  }
}

// Custom Types for internal use
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

// Enhanced database query function with retries
async function queryDatabaseWithRetry(queryFn: () => Promise<any>, maxRetries = 3, timeout = 15000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Database query timed out after ${timeout}ms`)), timeout);
      });
      
      // Execute the query with timeout
      return await Promise.race([queryFn(), timeoutPromise]);
    } catch (error: any) {
      lastError = error;
      console.warn(`Database query attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // Don't wait on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms, etc.
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
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
          console.error("Missing credentials", { email: !!credentials?.email, password: !!credentials?.password });
          return null;
        }
        
        try {
          console.log(`Login attempt for: ${credentials.email}`);
          
          // Check database connection first with multiple attempts
          let isConnected = false;
          
          try {
            // Try to ping the database up to 3 times
            for (let i = 0; i < 3; i++) {
              isConnected = await pingDatabase();
              console.log(`Database connection attempt ${i+1}: ${isConnected ? 'connected' : 'failed'}`);
              if (isConnected) break;
              
              // Short delay between attempts
              if (i < 2) await new Promise(r => setTimeout(r, 1000));
            }
            
            if (!isConnected) {
              console.warn("Database connection is unavailable during login attempt - using fallback auth");
              
              // Try fallback authentication for users registered during outage
              const fallbackUser = await checkFallbackUsers(credentials.email, credentials.password);
              if (fallbackUser) {
                console.log(`Authenticated ${credentials.email} via fallback mechanism`);
                return fallbackUser;
              }
              
              throw new Error("We're experiencing database connectivity issues. Please try again in a few moments.");
            }
          } catch (connError) {
            console.error("Database connectivity check failed:", connError);
            
            // Try fallback authentication before giving up
            const fallbackUser = await checkFallbackUsers(credentials.email, credentials.password);
            if (fallbackUser) {
              console.log(`Authenticated ${credentials.email} via fallback after connectivity error`);
              return fallbackUser;
            }
            
            throw new Error("We're having trouble connecting to our database. Please try again shortly.");
          }
          
          console.log(`Querying database for user: ${credentials.email}`);
          
          // Get the user from database with retries and extended timeout
          const user = await queryDatabaseWithRetry(
            () => prisma.user.findUnique({
              where: { 
                email: credentials.email.trim().toLowerCase() 
              }
            }),
            3,  // 3 retries
            15000 // 15 second timeout
          );
          
          if (!user) {
            console.log(`No user found with email: ${credentials.email}`);
            
            // Try one more search with case-insensitive compare
            const userCaseInsensitive = await queryDatabaseWithRetry(
              () => prisma.user.findFirst({
                where: {
                  email: {
                    mode: 'insensitive',
                    equals: credentials.email.trim()
                  }
                }
              }),
              2,
              10000
            );
            
            if (userCaseInsensitive) {
              console.log(`Found user with case-insensitive search: ${userCaseInsensitive.email}`);
              
              // Verify password for case-insensitive match
              if (userCaseInsensitive.password) {
                const passwordMatch = await bcrypt.compare(credentials.password, userCaseInsensitive.password);
                
                if (passwordMatch) {
                  console.log(`Password matched for case-insensitive user: ${userCaseInsensitive.email}`);
                  
                  return {
                    id: userCaseInsensitive.id.toString(),
                    email: userCaseInsensitive.email,
                    name: userCaseInsensitive.name || userCaseInsensitive.email.split('@')[0],
                    image: userCaseInsensitive.image,
                    isAdmin: userCaseInsensitive.isAdmin,
                    isActive: userCaseInsensitive.status === 'ACTIVE',
                    role: userCaseInsensitive.role || 'USER',
                  };
                }
              }
            }
            
            // One more check of fallback users if normal DB lookup fails
            const fallbackUser = await checkFallbackUsers(credentials.email, credentials.password);
            if (fallbackUser) {
              console.log(`Found fallback user for: ${credentials.email}`);
              return fallbackUser;
            }
            
            throw new Error("No account found with this email address");
          }
          
          console.log(`User found, verifying password for: ${credentials.email}`);
    
          // Verify password
          if (!user.password) {
            console.error(`User ${credentials.email} has no password set`);
            throw new Error("Account requires password reset");
          }
          
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          console.log(`Password verification result for ${credentials.email}: ${passwordMatch ? 'match' : 'mismatch'}`);
          
          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }
          
          console.log(`Authentication successful for: ${credentials.email}`);
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image,
            isAdmin: user.isAdmin,
            isActive: user.status === 'ACTIVE',
            role: user.role || 'USER',
          };
          
        } catch (error: any) {
          console.error("Authentication error:", error);
          
          // Provide user-friendly error messages based on the error type
          if (error.message.includes("database") || error.message.includes("timed out") || 
              error.message.includes("connect") || error.message.includes("prisma")) {
            throw new Error("We're experiencing technical difficulties. Please try again in a few moments.");
          } else if (error.message.includes("password")) {
            throw new Error("Invalid email or password");
          } else if (error.message.includes("not found") || error.message.includes("No account")) {
            throw new Error("Invalid email or password");
          } else {
            throw new Error("Authentication failed. Please check your credentials and try again.");
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
            // Use enhanced database query function
            const userStatus = await queryDatabaseWithRetry(
              () => prisma.user.findUnique({
                where: { id: parseInt(token.user!.id, 10) },
                select: { status: true, role: true }
              }),
              2,  // 2 retries
              5000 // 5 second timeout
            );
            
            if (userStatus) {
              // Map status field to isActive
              token.user.isActive = userStatus.status === 'ACTIVE';
              
              // Only set as admin if their email is admin email and role is ADMIN
              const adminEmails = ['piku@gmail.com', 'admin@gmail.com'];
              if (adminEmails.includes(token.user.email) && userStatus.role === 'ADMIN') {
                token.user.isAdmin = true;
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
        
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        // Return the token without modification in case of errors
        return token;
      }
    },
    
    async session({ session, token }) {
      if (session.user) {
        // Set user ID from token
        session.user.id = token.user?.id || token.sub || '';
        
        // Copy all user properties from token to session
        if (token.user) {
          Object.assign(session.user, token.user);
        }
        
        // Add legacy custom fields if they exist directly on token
        if ('role' in token) session.user.role = token.role as string;
        if ('username' in token) session.user.username = token.username as string;
        if ('isAdmin' in token) session.user.isAdmin = token.isAdmin as boolean;
        if ('isActive' in token) session.user.isActive = token.isActive as boolean;
        
        // Add fallback flag if present
        if (token.isFallbackUser) {
          (session as any).isFallbackUser = true;
          session.user.isAdmin = false; // Ensure fallback users are never admins
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is an absolute URL that starts with the base URL
      if (url.startsWith(baseUrl)) return url;
      
      // If the URL is a relative path
      if (url.startsWith('/')) return new URL(url, baseUrl).toString();
      
      // If URL contains multiple nested callbackUrls, reset to dashboard
      if (url.includes('callbackUrl') && url.includes('%252F')) {
        return baseUrl + '/dashboard';
      }
      
      // Default fallback - return to base
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth?mode=signin',
    signOut: '/auth?mode=signout',
    error: '/auth?mode=error',
    newUser: '/auth?mode=register'
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