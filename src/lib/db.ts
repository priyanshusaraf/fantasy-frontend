import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure Prisma client with proper settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Use singleton pattern to ensure only one Prisma instance
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Add connection health check function
export const checkDatabaseConnection = async () => {
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection check failed:", error);
    return false;
  }
};

// Handle errors by logging them
// This is useful for debugging connection issues
prisma.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    console.error('Prisma query error:', error);
    throw error;
  }
});

// Handle graceful shutdowns
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
