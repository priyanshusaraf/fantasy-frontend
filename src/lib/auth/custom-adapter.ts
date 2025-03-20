import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { User } from "@prisma/client";

/**
 * Generate a unique username based on name or email
 */
function generateUniqueName(baseName: string): string {
  // Generate a random 4-digit number to append to the username
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${baseName.replace(/[^a-zA-Z0-9]/g, '_')}_${randomNum}`;
}

/**
 * Converts a Prisma User to an AdapterUser
 */
function prismaToPrismaAdapter(user: User | null): AdapterUser | null {
  if (!user) return null;
  
  return {
    id: user.id.toString(),
    email: user.email,
    emailVerified: null,
    name: user.name,
    image: user.image,
  };
}

/**
 * Creates a custom adapter for NextAuth
 * With enhanced error handling and logging
 */
export function createCustomAdapter(): Adapter {
  return {
    // Wrap the default adapter methods, add logging and additional error handling
    ...PrismaAdapter(prisma),

    // Override createUser method to add logging, check for existing users, and create a wallet
    async createUser(userData: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      try {
        console.log("Creating user in custom adapter:", { email: userData.email });
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        }).catch(error => {
          console.error("Database error when checking existing user:", error);
          // Return null to indicate no user was found - allows continued processing
          return null;
        });
        
        if (existingUser) {
          console.log("User already exists, returning existing user:", { id: existingUser.id });
          return prismaToPrismaAdapter(existingUser) as AdapterUser;
        }
        
        // Create user with additional fields
        const createdUser = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name || null,
            image: userData.image || null,
            username: generateUniqueName(userData.name || userData.email.split('@')[0]), // Generate a username if not provided
          }
        }).catch(error => {
          console.error("Database error when creating user:", error);
          // Throw a specific error that won't block auth but gives good info
          throw new Error(`Failed to create user: ${error.message}`);
        });
        
        console.log("User created successfully:", { id: createdUser.id });
        
        // Create a wallet for the user
        try {
          await prisma.wallet.create({
            data: {
              userId: createdUser.id,
              balance: 0,
            }
          });
          
          console.log("NextAuth adapter: Wallet created for user:", createdUser.id);
        } catch (walletError) {
          console.error("NextAuth adapter: Error creating wallet:", walletError);
        }
        
        return prismaToPrismaAdapter(createdUser) as AdapterUser;
      } catch (error) {
        console.error("Error in createUser:", error);
        // Rethrow with more context
        throw error;
      }
    },
    
    // Override linkAccount method for error handling
    async linkAccount(accountData: AdapterAccount): Promise<AdapterAccount> {
      try {
        console.log("Linking account in custom adapter:", { 
          provider: accountData.provider, 
          userId: accountData.userId 
        });
        
        const adapter = PrismaAdapter(prisma);
        const linkedAccount = await adapter.linkAccount(accountData);
        console.log("NextAuth adapter: Account linked successfully");
        return linkedAccount;
      } catch (error) {
        console.error("Error in linkAccount:", error);
        throw error;
      }
    },
    
    // Add better error handling for getUser
    async getUser(id: string): Promise<AdapterUser | null> {
      try {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(id) }
        }).catch(error => {
          console.error("Database error in getUser:", error);
          return null;
        });
        
        return prismaToPrismaAdapter(user);
      } catch (error) {
        console.error("Error in getUser:", error);
        return null; // Return null instead of throwing to keep auth working
      }
    },
    
    // Add better error handling for getUserByEmail
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      try {
        const user = await prisma.user.findUnique({
          where: { email }
        }).catch(error => {
          console.error("Database error in getUserByEmail:", error);
          return null;
        });
        
        return prismaToPrismaAdapter(user);
      } catch (error) {
        console.error("Error in getUserByEmail:", error);
        return null; // Return null instead of throwing to keep auth working
      }
    },
    
    // Add better error handling for getUserByAccount
    async getUserByAccount({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">): Promise<AdapterUser | null> {
      try {
        const account = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId
            }
          },
          include: { user: true }
        }).catch(error => {
          console.error("Database error in getUserByAccount:", error);
          return null;
        });
        
        if (!account) return null;
        
        return prismaToPrismaAdapter(account.user);
      } catch (error) {
        console.error("Error in getUserByAccount:", error);
        return null; // Return null instead of throwing to keep auth working
      }
    },
  };
} 