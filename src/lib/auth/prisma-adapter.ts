// src/lib/auth/prisma-adapter.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

/**
 * A custom Prisma Adapter that maps NextAuth's `image` field to our schema's `profileImage` field
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    ...PrismaAdapter(prisma),

    // Override the createUser method to handle the image -> profileImage mapping
    async createUser(data) {
      const { image, ...userData } = data;

      return prisma.user.create({
        data: {
          ...userData,
          profileImage: image, // Map image to profileImage
          role: "USER", // Default role
          isApproved: true, // Auto-approve regular users
        },
      });
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) return null;

      // Map profileImage back to image for NextAuth
      return {
        ...user,
        id: user.id.toString(),
        image: user.profileImage,
      };
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      // Map profileImage back to image for NextAuth
      return {
        ...user,
        id: user.id.toString(),
        image: user.profileImage,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });

      if (!account) return null;

      const { user } = account;

      // Map profileImage back to image for NextAuth
      return {
        ...user,
        id: user.id.toString(),
        image: user.profileImage,
      };
    },

    async updateUser(user) {
      const { id, image, ...data } = user;

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          ...data,
          profileImage: image, // Map image to profileImage
        },
      });

      return {
        ...updatedUser,
        id: updatedUser.id.toString(),
        image: updatedUser.profileImage,
      };
    },
  };
}
