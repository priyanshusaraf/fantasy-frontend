import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

/**
 * Creates a custom adapter that maps NextAuth fields to our database schema
 */
export function createCustomAdapter(): Adapter {
  return PrismaAdapter(prisma);
} 