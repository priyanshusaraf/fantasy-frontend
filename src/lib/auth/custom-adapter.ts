import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

/**
 * Creates a custom adapter that maps NextAuth fields to our database schema
 * with enhanced error handling and logging
 */
export function createCustomAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma);
  
  // Wrap adapter methods with error handling and logging
  return {
    ...baseAdapter,
    
    // Override createUser to add additional logging and validation
    createUser: async (data) => {
      try {
        console.log("NextAuth adapter: Creating user with email:", data.email);
        
        // Check if user already exists before trying to create
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });
        
        if (existingUser) {
          console.log("NextAuth adapter: User already exists with email:", data.email);
          return existingUser;
        }
        
        // Create the user with default role and status
        const user = await baseAdapter.createUser({
          ...data,
          role: "USER", // Default role
          status: "ACTIVE", // Default status
        });
        
        console.log("NextAuth adapter: User created successfully:", {
          id: user.id,
          email: user.email,
          role: user.role,
        });
        
        // Create wallet for the user
        await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
          }
        });
        
        console.log("NextAuth adapter: Wallet created for user:", user.id);
        
        return user;
      } catch (error) {
        console.error("NextAuth adapter: Error creating user:", error);
        throw error;
      }
    },
    
    // Override linkAccount to add better error handling
    linkAccount: async (data) => {
      try {
        console.log("NextAuth adapter: Linking account for user:", data.userId);
        const account = await baseAdapter.linkAccount(data);
        console.log("NextAuth adapter: Account linked successfully");
        return account;
      } catch (error) {
        console.error("NextAuth adapter: Error linking account:", error);
        throw error;
      }
    },
    
    // Add additional error handling for other methods
    getUser: async (id) => {
      try {
        const user = await baseAdapter.getUser(id);
        return user;
      } catch (error) {
        console.error("NextAuth adapter: Error getting user by ID:", error);
        throw error;
      }
    },
    
    getUserByEmail: async (email) => {
      try {
        const user = await baseAdapter.getUserByEmail(email);
        return user;
      } catch (error) {
        console.error("NextAuth adapter: Error getting user by email:", error);
        throw error;
      }
    },
    
    getUserByAccount: async (providerAccountId) => {
      try {
        const user = await baseAdapter.getUserByAccount(providerAccountId);
        return user;
      } catch (error) {
        console.error("NextAuth adapter: Error getting user by account:", error);
        throw error;
      }
    },
  };
} 