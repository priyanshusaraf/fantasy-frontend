import NextAuth from "next-auth";
import authOptions from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";
import { pingDatabase } from "@/lib/prisma";
import { Credentials } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt";
import { PrismaAdapter } from "@auth/prisma-adapter";

// Enhanced handler with error protection
async function handleAuthRequest(req: NextRequest, context: any) {
  try {
    // Check database connection before proceeding
    const dbAvailable = await pingDatabase().catch(() => false);
    
    if (!dbAvailable) {
      console.warn("Database unavailable during auth request");
    }
    
    // Add custom headers for debugging
    const headers = new Headers();
    headers.set("X-Auth-Database-Available", dbAvailable ? "true" : "false");
    
    // Process auth request with error timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Auth request timed out")), 10000)
    );
    
    const authPromise = NextAuth(authOptions)(req, context);
    
    // Await with timeout to prevent hanging
    const result = await Promise.race([authPromise, timeoutPromise]);
    
    // Add custom headers to response if it's a NextResponse
    if (result instanceof NextResponse) {
      for (const [key, value] of headers.entries()) {
        result.headers.set(key, value);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Auth handler error:", error);
    
    // Create a graceful error response
    return new NextResponse(JSON.stringify({
      error: "Authentication service temporarily unavailable",
      retryAfter: 10
    }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "10"
      }
    });
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // Your existing credentials provider
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        usernameOrEmail: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Your existing authorize logic for regular users
        if (!credentials?.usernameOrEmail || !credentials?.password) {
          return null;
        }
        
        // Existing user lookup code
        // ...
      }
    }),
    
    // Add separate admin credentials provider
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        usernameOrEmail: { label: "Admin Email", type: "email" },
        password: { label: "Admin Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.usernameOrEmail || !credentials?.password) {
          return null;
        }
        
        // Special case for admin authentication
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        // Debug logs
        console.log("Admin auth attempt:", {
          providedEmail: credentials.usernameOrEmail,
          adminEmailMatch: credentials.usernameOrEmail === adminEmail,
          adminEmailExists: !!adminEmail,
          passwordLength: credentials.password?.length || 0,
          adminPasswordLength: adminPassword?.length || 0
        });
        
        if (
          adminEmail &&
          adminPassword &&
          credentials.usernameOrEmail.toLowerCase() === adminEmail.toLowerCase() &&
          credentials.password === adminPassword
        ) {
          // Create an admin user object
          return {
            id: "admin-master",
            email: adminEmail,
            name: "System Admin",
            role: "MASTER_ADMIN",
            isAdmin: true
          };
        }
        
        return null;
      }
    })
  ],
  
  callbacks: {
    // Your existing callbacks
    
    // Add or modify session callback
    async session({ session, token }) {
      if (token.sub === "admin-master") {
        session.user.role = "MASTER_ADMIN";
        session.user.isAdmin = true;
      } else if (token.role) {
        // Your existing role assignment
        session.user.role = token.role;
      }
      
      // Any other session logic you have
      
      return session;
    },
    
    // Add or modify JWT callback
    async jwt({ token, user }) {
      if (user?.isAdmin) {
        token.isAdmin = true;
        token.role = "MASTER_ADMIN";
      } else if (user?.role) {
        // Your existing role handling
        token.role = user.role;
      }
      
      // Any other token logic you have
      
      return token;
    }
  },
  
  // Your existing NextAuth configuration options
  pages: {
    signIn: '/auth',
    // Any other custom pages
  },
  session: {
    strategy: "jwt",
    // Any other session config
  }
  // Any other options
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
