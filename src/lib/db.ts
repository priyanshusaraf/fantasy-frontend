import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Track database connection status
let isConnected = false;
const CONNECTION_RETRY_ATTEMPTS = 3;
const CONNECTION_RETRY_DELAY = 1000; // 1 second

// Configure Prisma client with proper settings
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Add middleware for connection tracking and retry
  client.$use(async (params, next) => {
    try {
      const result = await next(params);
      isConnected = true; // Set connection status to true on success
      return result;
    } catch (error: any) {
      // Check if this is a connection error
      const isConnectionError = 
        error.message?.includes('connect') || 
        error.message?.includes('connection') ||
        error.message?.includes('timeout') ||
        error.code === 'P1001' || 
        error.code === 'P1002';
      
      if (isConnectionError) {
        console.error('Database connection error:', error.message);
        isConnected = false;
      }
      
      throw error;
    }
  });

  return client;
};

// Use singleton pattern to ensure only one Prisma instance
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Add connection health check function with retry logic
export const checkDatabaseConnection = async () => {
  // If already connected recently, return cached status
  if (isConnected) {
    return true;
  }

  // Try multiple times with increasing delay
  for (let attempt = 0; attempt < CONNECTION_RETRY_ATTEMPTS; attempt++) {
    try {
      // Simple query to check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      isConnected = true;
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error(`Database connection check failed (attempt ${attempt + 1}/${CONNECTION_RETRY_ATTEMPTS}):`, error);
      
      // If not the last attempt, wait before retrying
      if (attempt < CONNECTION_RETRY_ATTEMPTS - 1) {
        const delay = CONNECTION_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  isConnected = false;
  return false;
};

// Initialize connection - don't block startup, but check connection
Promise.resolve().then(() => {
  checkDatabaseConnection()
    .then(connected => {
      if (connected) {
        console.log('Initial database connection successful');
      } else {
        console.error('Initial database connection failed, will retry on demand');
      }
    })
    .catch(err => {
      console.error('Error during initial database check:', err);
    });
});

// Handle graceful shutdowns
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
