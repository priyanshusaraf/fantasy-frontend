import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import { createPrismaAdapter } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  adapter: createPrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.isApproved = user.isApproved;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.isApproved = token.isApproved as boolean;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      if (account && profile) {
        if (profile.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email }
          });
          
          if (existingUser) {
            const linkedAccount = await prisma.account.findFirst({
              where: { 
                userId: existingUser.id,
                provider: account.provider
              }
            });
            
            if (!linkedAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state
                }
              });
              
              if (!existingUser.name || !existingUser.isApproved) {
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name: profile.name || existingUser.username || profile.email.split('@')[0],
                    isApproved: true
                  }
                });
              }
            }
            
            user.id = existingUser.id.toString();
            return true;
          }
        }
      }
      
      return true;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
