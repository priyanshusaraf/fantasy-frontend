import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

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
    
    // Configure connection parameters based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production settings - optimal for serverless Next.js with AWS RDS
      // Use a smaller connection pool size to prevent overwhelming RDS
      params.set('connection_limit', '1'); // Recommended for serverless environments
      params.set('pool_timeout', '10');
      params.set('connect_timeout', '15');  // Slightly longer timeout for production
      params.set('wait_timeout', '60'); // Default wait timeout
      params.set('socket_timeout', '60'); // Socket timeout
      
      // Additional recommended parameters for MySQL RDS
      params.set('ssl', 'true'); // Use SSL for production RDS connections
      params.set('connection_retries', '3'); // Retry connection 3 times
      params.set('retry_delay', '3'); // Delay 3 seconds between retries
    } else {
      // Development settings
      params.set('connection_limit', '5');  // More connections for development
      params.set('pool_timeout', '10');
      params.set('connect_timeout', '20');  // Shorter timeout for faster feedback
    }
    
    // Add parameters back to URL
    if (params.toString()) {
      cleanUrl += `?${params.toString()}`;
    }
    
    console.log(`Database URL processed with connection parameters for ${process.env.NODE_ENV}`);
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
    // Get the processed URL
    const databaseUrl = getValidDatabaseUrl();
    
    // PrismaClient configuration
    const clientConfig: Prisma.PrismaClientOptions = {
      log: process.env.NODE_ENV === 'development' 
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' }
          ] 
        : [
            { level: 'error', emit: 'stdout' }
          ],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      errorFormat: 'pretty',
    };
    
    // Create the client
    const client = new PrismaClient(clientConfig);
    
    // Apply middleware for connection tracking (in production)
    if (process.env.NODE_ENV === 'production') {
      // Connection tracking middleware
      client.$use(async (params, next) => {
        const startTime = Date.now();
        try {
          return await next(params);
        } catch (error: any) { // Type error as any to access message property
          // Log connection errors with operation details
          console.error(`Database operation ${params.model}.${params.action} failed:`, error);
          // Update connection status if it's a connection error
          if (error.message?.includes('connect') || error.message?.includes('connection')) {
            isDatabaseConnected = false;
          }
          throw error;
        } finally {
          // Log slow queries in production (over 1000ms)
          const duration = Date.now() - startTime;
          if (duration > 1000) {
            console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
          }
        }
      });
    }
    
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
    
    // Set a shorter timeout in production to detect issues faster
    const timeoutDuration = process.env.NODE_ENV === 'production' ? 2000 : 3000;
    
    // Simple query with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database ping timeout')), timeoutDuration)
    );
    
    // The actual query - try a simple query that doesn't hit any table
    const queryPromise = prisma.$queryRaw`SELECT 1 as connected`;
    
    // Race between the query and the timeout
    await Promise.race([queryPromise, timeoutPromise]);
    
    // If we got here, the query succeeded
    isDatabaseConnected = true;
    // Only log in development to avoid excessive logging in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Database ping successful');
    }
    return true;
  } catch (error) {
    // Update the connection status
    isDatabaseConnected = false;
    
    // Get a more specific error message
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error(`Database ping failed: ${errorMessage}`);
    
    // If this is a specific AWS RDS error, log more details
    if (errorMessage.includes('too many connections') || 
        errorMessage.includes('connection limit') ||
        errorMessage.includes('capacity')) {
      console.error('AWS RDS connection limit may be exceeded. Consider scaling up the RDS instance or reducing connection_limit parameter.');
    }
    
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

/**
 * Function to diagnose common RDS connection issues
 * This should only be called in a server context
 */
export async function diagnoseConnectionIssue(): Promise<string> {
  try {
    // Extract database details from the connection string
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) {
      return 'DATABASE_URL environment variable is not set';
    }
    
    // Parse the connection string
    let url;
    try {
      url = new URL(dbUrl.replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    } catch (error) {
      return 'Invalid DATABASE_URL format';
    }
    
    // Check each component
    const results = [];
    
    // 1. Check host
    const host = url.hostname;
    if (!host) {
      results.push('❌ Missing hostname in DATABASE_URL');
    } else {
      results.push(`✓ Database host: ${host}`);
      
      // Check if it's an AWS RDS instance
      if (host.includes('rds.amazonaws.com')) {
        results.push('✓ Detected AWS RDS instance');
      }
    }
    
    // 2. Check port
    const port = url.port || '3306';
    results.push(`✓ Database port: ${port}`);
    
    // 3. Check database name
    const database = url.pathname.replace(/^\//, '');
    if (!database) {
      results.push('❌ Missing database name in DATABASE_URL');
    } else {
      results.push(`✓ Database name: ${database}`);
    }
    
    // 4. Check credentials (just presence, not validity)
    if (!url.username) {
      results.push('❌ Missing username in DATABASE_URL');
    } else {
      results.push(`✓ Username is set`);
    }
    
    if (!url.password) {
      results.push('❌ Missing password in DATABASE_URL');
    } else {
      results.push(`✓ Password is set`);
    }
    
    // 5. Check connection parameters
    const params = new URLSearchParams(url.search);
    if (!params.has('connection_limit')) {
      results.push('⚠️ No connection_limit specified in DATABASE_URL');
    }
    
    if (!params.has('connect_timeout')) {
      results.push('⚠️ No connect_timeout specified in DATABASE_URL');
    }
    
    // 6. Check actual connectivity
    try {
      const connected = await pingDatabase();
      if (connected) {
        results.push('✓ Database connection successful');
      } else {
        results.push('❌ Database connection failed');
      }
    } catch (error) {
      results.push(`❌ Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Return formatted results
    return results.join('\n');
  } catch (error) {
    return `Failed to diagnose connection: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export default prisma;
