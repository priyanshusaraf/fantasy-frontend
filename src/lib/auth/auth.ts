// lib/auth/auth.ts
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email) {
        return false;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (!existingUser) {
        // Create a new user
        await prisma.user.create({
          data: {
            email: profile.email,
            username: profile.name || profile.email.split("@")[0],
            role: "USER", // Match your enum from the other file
            isVerified: true,
            isApproved: true, // Set this based on your requirements
            googleId: profile.sub,
            password: null, // OAuth users don't have a password
            createdAt: new Date(),
            profileImage: profile.picture,
          },
        });
      } else if (existingUser.profileImage !== profile.picture) {
        // Update profile image if changed
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { profileImage: profile.picture },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Get additional user data from the database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isApproved = dbUser.isApproved;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

// Augment next-auth types to include our custom fields
declare module "next-auth" {
  interface User {
    role?: string;
    isApproved?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      isApproved: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isApproved?: boolean;
  }
}
