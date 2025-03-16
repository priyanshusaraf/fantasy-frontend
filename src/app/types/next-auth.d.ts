import "next-auth";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null; // NextAuth defaults
      username?: string;
      role?: string;
      isApproved?: boolean;
    };
  }

  interface User extends Partial<PrismaUser> {
    id: string | number;
    username?: string;
    role?: string;
    isApproved?: boolean;
    image?: string | null; // mapped from `profileImage`
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string | number;
    username?: string;
    role?: string;
    isApproved?: boolean;
  }
}
