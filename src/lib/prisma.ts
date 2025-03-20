import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Connect to the database with retry logic for production environments
 */
export async function connectDB() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      await prisma.$connect();
      console.log('🚀 Database connected successfully');
      return;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection attempt ${retries} failed:`, error);
      
      if (retries >= MAX_RETRIES) {
        console.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
        
        // In production, we'll log the error but not exit the process
        // This allows the application to still serve static content
        if (process.env.NODE_ENV === 'production') {
          console.error('Continuing application startup without database connection');
          return;
        }
        
        // In development, exit the process to make the error more obvious
        process.exit(1);
      }
      
      // Wait before retrying
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    // Don't exit the process on disconnect error
  }
}

// Graceful shutdown handling
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    await disconnectDB();
    process.exit(0);
  });
});

export default prisma;
