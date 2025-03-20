import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Track database connectivity status
let isDatabaseConnected = false;

// Direct solution for database connection issues
function getValidDatabaseUrl() {
  // Get the original DB URL
  let dbUrl = process.env.DATABASE_URL || '';
  
  // Remove quotes if they're present
  dbUrl = dbUrl.replace(/^"|"$/g, '');
  dbUrl = dbUrl.replace(/^'|'$/g, '');
  
  // Parse the MySQL connection string to ensure it's valid
  try {
    // Basic validation to ensure it's a MySQL URL
    if (!dbUrl.startsWith('mysql://')) {
      console.error('Invalid database URL format - not a MySQL URL');
      // Provide a default local URL for development if needed
      if (process.env.NODE_ENV === 'development') {
        return 'mysql://root:password@localhost:3306/fantasy_db?connect_timeout=30';
      } else {
        throw new Error('Invalid database URL format');
      }
    }

    // Extract parts from URL to build a clean version
    const urlParts = new URL(dbUrl);
    
    // Ensure we have all required parts
    if (!urlParts.hostname || !urlParts.pathname) {
      throw new Error('Missing hostname or database name in connection string');
    }
    
    // Rebuild the connection string with explicit parameters
    const username = urlParts.username;
    const password = urlParts.password;
    const host = urlParts.hostname;
    const port = urlParts.port || '3306';
    const database = urlParts.pathname.replace(/^\//, '');
    
    // Build clean URL with connection parameters
    let cleanUrl = `mysql://${username}:${password}@${host}:${port}/${database}`;
    
    // Add essential connection parameters
    const params = new URLSearchParams(urlParts.search);
    
    // Add critical connection parameters
    params.set('connect_timeout', '20');  // Shorter timeout for faster feedback
    params.set('connection_limit', '10');  // More connections for high load
    params.set('pool_timeout', '10');
    
    // Add parameters back to URL
    if (params.toString()) {
      cleanUrl += `?${params.toString()}`;
    }
    
    console.log(`Database URL processed with connection parameters`);
    return cleanUrl;
    
  } catch (error) {
    console.error('Error processing database URL:', error);
    // Return the original URL as fallback
    return dbUrl;
  }
}

// Create a PrismaClient with aggressive connection settings
export const prisma = globalForPrisma.prisma ?? (() => {
  console.log("Creating new PrismaClient with enhanced connection handling");
  
  try {
    // Get the PrismaClient with the processed URL
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: getValidDatabaseUrl(),
        },
      },
      errorFormat: 'pretty',
    });
    
    // Immediately test the connection (but don't block startup)
    Promise.resolve().then(async () => {
      try {
        // Try to establish connection
        await client.$connect();
        console.log('Initial database connection successful');
        isDatabaseConnected = true;
      } catch (error) {
        console.error('Initial database connection failed:', error);
        isDatabaseConnected = false;
        
        // Try to connect every 30 seconds in the background
        setInterval(async () => {
          try {
            await client.$connect();
            console.log('Reconnected to database');
            isDatabaseConnected = true;
          } catch (error) {
            console.error('Background reconnection attempt failed');
            isDatabaseConnected = false;
          }
        }, 30000); // Try every 30 seconds
      }
    });
    
    // Return the client
    return client;
  } catch (error) {
    console.error("Failed to create PrismaClient:", error);
    // Return a stub client that won't crash the app
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => { /* no-op */ };
        }
        if (prop === '$queryRaw') {
          return async () => null;
        }
        // Return a function that rejects with a friendly error
        return () => {
          console.error(`Database unavailable, operation ${String(prop)} failed`);
          return Promise.reject(new Error('Database connection unavailable'));
        };
      }
    });
  }
})();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Connect to the database
 */
export async function connectDB() {
  try {
    await prisma.$connect();
    isDatabaseConnected = true;
    console.log('🚀 Database connected successfully');
    return true;
  } catch (error) {
    isDatabaseConnected = false;
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function disconnectDB() {
  try {
    await prisma.$disconnect();
    isDatabaseConnected = false;
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// Add a ping method to check database connectivity
export async function pingDatabase(): Promise<boolean> {
  try {
    // Quick return if we already know database is disconnected
    if (!isDatabaseConnected) {
      console.log('Database is known to be disconnected');
      return false;
    }
    
    // Simple query with 3 second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database ping timeout')), 3000)
    );
    
    const queryPromise = prisma.$queryRaw`SELECT 1 as connected`;
    await Promise.race([queryPromise, timeoutPromise]);
    
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    isDatabaseConnected = false;
    console.error('Database ping failed:', error);
    return false;
  }
}

// Check if the database is currently connected
export function isDatabaseAvailable(): boolean {
  return isDatabaseConnected;
}

// Graceful shutdown handling
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    await disconnectDB();
    process.exit(0);
  });
});

export default prisma;
