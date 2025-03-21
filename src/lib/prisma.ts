import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Create a dummy client for the browser
const DummyPrismaClient = {
  $connect: async () => null,
  $disconnect: async () => null,
  $queryRaw: async () => null,
  $executeRaw: async () => null,
  $transaction: async () => [],
  user: {
    findUnique: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({ ...data.data, id: 'temp-id' }),
    update: async () => null,
    delete: async () => null,
    count: async () => 0,
  },
  // Add other models as needed with dummy implementations
};

// Track database connectivity status
let isDatabaseConnected = false;
let lastConnectionAttempt = 0;
const CONNECTION_ATTEMPT_THRESHOLD = 10000; // Only try reconnecting every 10 seconds

// Direct solution for database connection issues
function getValidDatabaseUrl() {
  // Running in browser, return a dummy URL
  if (typeof window !== 'undefined') {
    return 'dummy://browser';
  }
  
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
      params.set('connection_limit', '20');    // Increased for better handling of concurrent requests
      params.set('pool_timeout', '30');        // Increased to handle connection waits
      params.set('connect_timeout', '60');     // Extended timeout for production
      params.set('wait_timeout', '180');       // Longer wait timeout for AWS RDS
      params.set('socket_timeout', '60');      // Socket timeout
      params.set('pool_idle_timeout', '120');  // Connection pool idle timeout
      
      // Additional recommended parameters for MySQL RDS
      params.set('ssl', 'true');               // Use SSL for production RDS connections
      params.set('connection_retries', '3');   // Retry connection 3 times
      params.set('retry_delay', '3');          // Delay 3 seconds between retries
    } else {
      // Development settings
      params.set('connection_limit', '10');    // More connections for development
      params.set('pool_timeout', '20');
      params.set('connect_timeout', '30');     // Longer timeout for development
      params.set('wait_timeout', '60');        // Wait timeout
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

// Import Node.js modules conditionally only on server
let fs: any;
let path: any;

// Check if we're on the server
if (typeof window === 'undefined') {
  // We're on the server, safe to use Node.js modules
  try {
    fs = require('fs');
    path = require('path');
  } catch (e) {
    console.warn('Could not import Node.js fs/path modules');
  }
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only initialize PrismaClient on the server side
let prisma: any;

if (typeof window === 'undefined') {
  // Server-side code
  prisma = globalForPrisma.prisma ?? (() => {
    console.log("Creating new PrismaClient with enhanced connection handling for AWS RDS");
    
    try {
      // Get the processed URL
      const databaseUrl = getValidDatabaseUrl();
      
      // PrismaClient configuration
      const clientConfig: Prisma.PrismaClientOptions = {
        log: process.env.NODE_ENV === 'development' 
          ? [
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
      
      // Apply middleware for connection tracking and retry logic
      client.$use(async (params, next) => {
        const startTime = Date.now();
        const maxRetries = process.env.NODE_ENV === 'production' ? 3 : 1;
        let retries = 0;
        
        while (true) {
          try {
            const result = await next(params);
            
            // Update connection status on success
            isDatabaseConnected = true;
            
            // Log slow queries based on environment
            const duration = Date.now() - startTime;
            if (process.env.NODE_ENV === 'production' && duration > 1000) {
              console.warn(`Slow query detected (${duration}ms): ${params.model}.${params.action}`);
            } else if (process.env.NODE_ENV === 'development' && duration > 500) {
              console.log(`Slow query (${duration}ms): ${params.model}.${params.action}`);
            }
            
            return result;
          } catch (error: any) {
            // Detect connection errors
            const isConnectionError = error.message?.includes('connect') || 
                                     error.message?.includes('connection') ||
                                     error.message?.includes('timeout') ||
                                     error.code === 'P1001' || 
                                     error.code === 'P1002' ||
                                     error.code === 'ETIMEDOUT' ||
                                     error.code === 'ECONNREFUSED';
                                     
            if (isConnectionError && retries < maxRetries) {
              retries++;
              isDatabaseConnected = false;
              console.warn(`Database connection error, retrying (${retries}/${maxRetries})...`);
              // Exponential backoff: 200ms, 400ms, 800ms...
              await new Promise(r => setTimeout(r, 200 * Math.pow(2, retries - 1)));
              continue;
            }
            
            // Log the error with operation details
            if (isConnectionError) {
              console.error(`Database connection failed during ${params.model}.${params.action}`);
              isDatabaseConnected = false;
            } else {
              console.error(`Database operation ${params.model}.${params.action} failed:`, error);
            }
            
            throw error;
          }
        }
      });
      
      // Immediately test the connection (but don't block startup)
      Promise.resolve().then(async () => {
        try {
          // Try to establish connection
          await pingDatabase();
          console.log('Initial database connection successful');
          isDatabaseConnected = true;
        } catch (error) {
          console.error('Initial database connection failed:', error);
          isDatabaseConnected = false;
          
          // Try to connect every 30 seconds in the background
          setInterval(async () => {
            try {
              // Only attempt reconnection if we're still disconnected and not too soon after last attempt
              if (!isDatabaseConnected && (Date.now() - lastConnectionAttempt) > CONNECTION_ATTEMPT_THRESHOLD) {
                lastConnectionAttempt = Date.now();
                await pingDatabase();
                
                if (isDatabaseConnected) {
                  console.log('Reconnected to database');
                  
                  // Check for pending users in fallback storage and sync them
                  await syncFallbackStorage();
                }
              }
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
      // Return a proxy client as fallback to avoid app crashes
      return createProxyClient();
    }
  })();
  
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
} else {
  // Client-side code - use dummy implementation
  prisma = DummyPrismaClient;
}

// Create a proxy client that won't crash the app when database is down
function createProxyClient() {
  return new Proxy({} as PrismaClient, {
    get: (target, prop) => {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => { /* no-op */ };
      }
      if (prop === '$queryRaw' || prop === '$executeRaw') {
        return async () => null;
      }
      if (prop === '$transaction') {
        return async (arg: any) => {
          if (typeof arg === 'function') return null;
          return Array.isArray(arg) ? [] : null;
        };
      }
      // For model operations, return a function that logs and returns fallback data
      return () => {
        console.warn(`Database unavailable, operation ${String(prop)} using fallback`);
        return createFallbackHandler(String(prop));
      };
    }
  });
}

// Handle fallback data when database is unavailable
function createFallbackHandler(modelName: string) {
  return new Proxy({}, {
    get: (target, operation) => {
      return async (...args: any[]) => {
        const opStr = String(operation);
        console.log(`Database available: ${isDatabaseConnected}`);
        
        if (!isDatabaseConnected) {
          console.warn(`Database unavailable during ${modelName}.${opStr}`);
          
          // For user registration, implement fallback mechanism
          if (modelName === 'user' && opStr === 'create') {
            return handleUserFallback(args[0]?.data);
          }
          
          // Return empty results for queries
          if (opStr === 'findUnique' || opStr === 'findFirst') {
            return null;
          }
          if (opStr === 'findMany') {
            return [];
          }
          
          // For other operations, throw a friendly error
          throw new Error(`Database connection issue. Please try again later.`);
        }
        
        // We shouldn't get here if the database is disconnected
        throw new Error(`Database operation not implemented in fallback handler`);
      };
    }
  });
}

// Handle user registrations when database is down
async function handleUserFallback(userData: any) {
  if (!userData || !userData.email) {
    throw new Error('Invalid user data for fallback storage');
  }
  
  console.log(`Using fallback mechanism to save user: ${userData.email}`);
  
  try {
    // Generate a random ID for the user
    const userId = Math.floor(Math.random() * 1000000).toString();
    
    // Create a user object with the essentials
    const user = {
      id: userId,
      email: userData.email,
      name: userData.name || '',
      username: userData.username || userData.email.split('@')[0],
      password: userData.password || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: userData.role || 'USER',
      status: userData.status || 'ACTIVE',
      emailVerified: new Date(),
      isActive: true,
      // Add other fields as needed
    };
    
    // Store in memory temporarily
    storeFallbackUser(user);
    
    console.log(`User ${userData.email} saved to fallback storage`);
    return user;
  } catch (error) {
    console.error('Failed to save user to fallback storage:', error);
    throw new Error('Registration failed due to database issue');
  }
}

// In-memory storage of users when database is down
const fallbackUsers: Record<string, any> = {};

// Store a user in the fallback system
function storeFallbackUser(user: any) {
  fallbackUsers[user.email] = user;
  
  // Only save to file if on server
  if (typeof window === 'undefined' && fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'temp-users.json');
      
      // Read existing data if available
      let existingData: Record<string, any> = {};
      if (fs.existsSync(filePath)) {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      
      // Add new user
      existingData[user.email] = user;
      
      // Save back to file
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
      console.log(`User saved locally at ${filePath}`);
    } catch (error) {
      console.error('Failed to save user data to temporary file:', error);
    }
  } else {
    // In browser, just use memory storage
    console.log(`Running in browser: User data for ${user.email} stored in memory only.`);
  }
  
  // Store in memory too
  console.log(`User data for ${user.email} stored in memory. Will be synced when database is available.`);
}

// Sync users from fallback storage to database when connection is restored
async function syncFallbackStorage() {
  if (Object.keys(fallbackUsers).length === 0) return;
  
  console.log(`Attempting to sync ${Object.keys(fallbackUsers).length} users from fallback storage`);
  
  for (const email of Object.keys(fallbackUsers)) {
    try {
      const user = fallbackUsers[email];
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!existingUser) {
        // Create the user in the database
        const createdUser = await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            username: user.username,
            password: user.password,
            role: user.role || 'USER',
            status: user.status || 'ACTIVE',
            emailVerified: new Date()
          }
        });
        
        console.log(`Successfully synced user ${email} from fallback storage`);
        
        // Create wallet if needed
        try {
          await prisma.wallet.create({
            data: {
              userId: createdUser.id,
              balance: 0,
            }
          });
        } catch (walletError) {
          console.error(`Failed to create wallet for synced user ${email}:`, walletError);
        }
      } else {
        console.log(`User ${email} already exists in database, skipping sync`);
      }
      
      // Remove from fallback storage
      delete fallbackUsers[email];
      
    } catch (error) {
      console.error(`Failed to sync user ${email}:`, error);
    }
  }
}

/**
 * Connect to the database
 */
export async function connectDB() {
  if (typeof window !== 'undefined') {
    console.log('Running in browser, skipping DB connection');
    return false;
  }
  
  try {
    // Mark the attempt time
    lastConnectionAttempt = Date.now();
    
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
  if (typeof window !== 'undefined') {
    return;
  }
  
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
  if (typeof window !== 'undefined') {
    console.log('Running in browser, skipping DB ping');
    return false;
  }
  
  try {
    // Mark the attempt time
    lastConnectionAttempt = Date.now();
    
    // Quick return if we recently checked
    if (!isDatabaseConnected && (Date.now() - lastConnectionAttempt < 5000)) {
      console.log('Database is known to be disconnected and recently checked');
      return false;
    }
    
    // Set a timeout for the ping
    const timeoutDuration = process.env.NODE_ENV === 'production' ? 5000 : 3000;
    
    // Simple query with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database ping timeout')), timeoutDuration)
    );
    
    // The actual query - just select 1
    const queryPromise = prisma.$queryRaw`SELECT 1 as connected`;
    
    // Race between the query and the timeout
    await Promise.race([queryPromise, timeoutPromise]);
    
    // If we got here, the query succeeded
    isDatabaseConnected = true;
    return true;
  } catch (error) {
    console.error('Database ping failed:', error);
    isDatabaseConnected = false;
    return false;
  }
}

// Get the current database connection status
export function isDatabaseAvailable(): boolean {
  if (typeof window !== 'undefined') {
    return false;
  }
  return isDatabaseConnected;
}

// Diagnostic function to help identify connection issues
export async function diagnoseConnectionIssue(): Promise<string> {
  try {
    // Try a very simple query first
    const pingResult = await pingDatabase();
    if (!pingResult) {
      return "Database connection failed - unable to ping the database";
    }
    
    // Database is connected, try to get some basic info
    const serverInfo = await prisma.$queryRaw`SELECT @@version as version, @@max_connections as max_connections, @@wait_timeout as wait_timeout`;
    return `Database connection successful. Server info: ${JSON.stringify(serverInfo)}`;
  } catch (error: any) {
    return `Database diagnostic failed: ${error.message || 'Unknown error'}`;
  }
}

// Add named export for prisma
export { prisma };

// Default export remains unchanged
export default prisma;
