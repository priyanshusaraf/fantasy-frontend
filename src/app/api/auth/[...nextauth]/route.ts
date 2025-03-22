import NextAuth from "next-auth";
import authOptions from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";
import { pingDatabase } from "@/lib/prisma";
import { Credentials } from "next-auth/providers";

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

export async function GET(request: NextRequest, context: any) {
  return handleAuthRequest(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return handleAuthRequest(request, context);
}

export { authOptions };

// Add this to your NextAuth configuration
// Inside the NextAuth() configuration object:

providers: [
  // Keep your existing providers
  
  // Add this special admin credentials provider
  Credentials({
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
      
      // Debug logs - remove in production
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
      
      // Fall back to regular authentication
      return null;
    }
  }),
],

// Modify your callbacks
callbacks: {
  // Keep your existing callbacks
  
  // Enhance the session callback
  async session({ session, token }) {
    if (token.sub === "admin-master") {
      session.user.role = "MASTER_ADMIN";
      session.user.isAdmin = true;
    }
    
    // Your existing session logic...
    
    return session;
  },
  
  // Enhance the JWT callback
  async jwt({ token, user }) {
    if (user?.isAdmin) {
      token.isAdmin = true;
      token.role = "MASTER_ADMIN";
    }
    
    // Your existing JWT logic...
    
    return token;
  }
},
