import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

// Export authOptions so it can be used with getServerSession
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optional: Add scope to get additional user info
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID and role to the session
      session.user.id = user.id;
      session.user.role = user.role; // Ensure your User model includes a 'role'
      return session;
    },
    async signIn({ account, profile }) {
      // Optional: Check if the email is verified for Google accounts
      if (account?.provider === "google") {
        return profile?.email_verified ?? false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "database", // Use database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
