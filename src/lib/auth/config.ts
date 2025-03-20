import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createCustomAdapter } from "./custom-adapter";
import { env } from "@/lib/env";

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
  ],
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Add custom user fields from database to JWT
        if ('role' in user) token.role = user.role;
        if ('username' in user) token.username = user.username;
        if ('status' in user) token.status = user.status;
        
        // Restrict admin access to specific emails
        if (token.email === 'thematchupcompany@gmail.com' || token.email === 'your-second-email@example.com') {
          token.role = 'MASTER_ADMIN';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        // Add custom user fields from JWT to session
        if ('role' in token) session.user.role = token.role;
        if ('username' in token) session.user.username = token.username;
        if ('status' in token) session.user.status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions; 