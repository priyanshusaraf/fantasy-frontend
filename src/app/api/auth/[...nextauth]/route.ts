import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const handler = NextAuth({
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
      // Add user ID and any additional fields to the session
      session.user.id = user.id;
      session.user.role = user.role; // Assuming you have a role in your User model
      return session;
    },
    async signIn({ account, profile }) {
      // Optional: Add custom sign-in logic
      // For example, check if the email is verified
      if (account?.provider === "google") {
        return profile?.email_verified ?? false;
      }
      return true;
    },
  },
  pages: {
    // Custom pages if needed
    signIn: "/login",
    error: "/auth/error",
  },
  // Optional: Configure session handling
  session: {
    strategy: "database", // Use database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };
