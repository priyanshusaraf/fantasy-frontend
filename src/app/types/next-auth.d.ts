import "next-auth";
import { User as PrismaUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
    } & Partial<PrismaUser>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
