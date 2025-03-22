import { PrismaClient } from "@prisma/client";
import { testSqliteConnection } from "./sqlite-fallback";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  fallbackPrisma: PrismaClient;
  isUsingFallback: boolean;
};

// Track database connection status
let isConnected = false;
let isUsingFallback = false;
let connectionAttempts = 0;
let lastConnectionError = "";
const MAX_CONNECTION_ATTEMPTS = 5;
const CONNECTION_RETRY_ATTEMPTS = 3;
const CONNECTION_RETRY_DELAY = 2000; // 2 seconds
const MAX_CONNECTION_ERRORS = 10; // Max number of errors before forcing fallback
let connectionErrors = 0;

// Helper to determine if fallback is enabled
const isFallbackEnabled = () => {
  return process.env.NODE_ENV === 'development' && 
         process.env.ENABLE_DB_FALLBACK === 'true' && 
         process.env.FALLBACK_DATABASE_URL?.startsWith('file:');
};

// Check if SQLite fallback is ready and connected
const isSqliteFallbackReady = () => {
  try {
    return testSqliteConnection();
  } catch (error) {
    console.error('Error testing SQLite fallback:', error);
    return false;
  }
};

/**
 * Create Prisma Client with custom options based on environment
 */
function createPrismaClient(connectionUrl?: string, isFallback = false) {
  const url = connectionUrl || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not defined");
  
  try {
    // Special handling for SQLite
    if (isFallback && url.startsWith('file:')) {
      // Test SQLite fallback first
      if (!isSqliteFallbackReady()) {
        console.error('SQLite fallback database is not ready or accessible');
        return null;
      }
    }
    
    console.log(`Initializing ${isFallback ? 'fallback' : 'main'} Prisma client...`);
    
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['error', 'warn'] 
        : ['error'],
      datasources: {
        db: {
          url,
        },
      },
      // Timeouts are configured in the DATABASE_URL connection string
    });

    // Add middleware for connection tracking and retry
    client.$use(async (params, next) => {
      // Skip transaction operations for connection testing
      const isConnectionTest = params.action === 'queryRaw' && 
                              (params.args?.query === 'SELECT 1' || params.args?.query === 'SELECT 1 as result');
      
      // For non-connection tests, implement retry logic with backoff
      const executeWithRetry = async (attempt = 0): Promise<any> => {
        try {
          const startTime = Date.now();
          const result = await next(params);
          const duration = Date.now() - startTime;
          
          // Log slow queries
          if (duration > 1000 && !isConnectionTest) {
            console.warn(`Slow query detected (${duration}ms): ${params.model}.${params.action}`);
          }
          
          if (!isFallback) {
            isConnected = true; // Only update main connection status
            connectionErrors = 0; // Reset error counter on success
            lastConnectionError = ""; // Clear error message on success
          }
          
          return result;
        } catch (error: any) {
          // Check if this is a connection error
          const isConnectionError = 
            error.message?.includes('connect') || 
            error.message?.includes('connection') ||
            error.message?.includes('timeout') ||
            error.code === 'P1001' || 
            error.code === 'P1002';
          
          if (isConnectionError && !isFallback) {
            lastConnectionError = error.message || "Unknown connection error";
            console.error(`[${new Date().toISOString()}] Database connection error (attempt ${attempt + 1}/${CONNECTION_RETRY_ATTEMPTS}):`, error.message);
            
            if (process.env.NODE_ENV === 'production') {
              // In production, also log detailed error information
              console.error('Error details:', {
                code: error.code,
                meta: error.meta,
                errorType: typeof error,
                params: JSON.stringify({
                  model: params.model,
                  action: params.action,
                  args: params.args ? Object.keys(params.args) : null
                })
              });
            }
            
            isConnected = false;
            connectionErrors++;
            
            // If we've had too many errors, force fallback
            if (connectionErrors >= MAX_CONNECTION_ERRORS && isFallbackEnabled() && !isUsingFallback) {
              console.log(`Too many connection errors (${connectionErrors}), forcing fallback database usage`);
              globalForPrisma.isUsingFallback = isUsingFallback = true;
            }
            
            // If we're not already using fallback, this might trigger a switch
            if (isFallbackEnabled() && !isUsingFallback) {
              console.log('Connection error detected, will try fallback on next operation');
            }
            
            // Retry the query if we haven't reached max attempts
            if (attempt < CONNECTION_RETRY_ATTEMPTS - 1) {
              const delay = CONNECTION_RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return executeWithRetry(attempt + 1);
            }
          }
          
          throw error;
        }
      };
      
      return executeWithRetry();
    });

    // Verify connection immediately
    if (!isFallback) {
      // Perform a test query to verify the connection works
      client.$queryRaw`SELECT 1 as result`
        .then(() => {
          console.log('Initial database connection test successful');
          isConnected = true;
          connectionErrors = 0;
        })
        .catch(err => {
          console.error('Initial database connection test failed:', err.message);
          lastConnectionError = err.message;
          isConnected = false;
          connectionErrors++;
        });
    }

    return client;
  } catch (err: any) {
    console.error(`Failed to initialize ${isFallback ? 'fallback' : 'main'} Prisma client:`, err.message);
    lastConnectionError = err.message || "Unknown initialization error";
    throw err;
  }
}

// Initialize main client
const mainPrismaClient = () => {
  return createPrismaClient(process.env.DATABASE_URL);
};

// Initialize fallback client (only if enabled)
const fallbackPrismaClient = () => {
  if (!isFallbackEnabled()) {
    return null;
  }
  return createPrismaClient(process.env.FALLBACK_DATABASE_URL, true);
};

// Initialize both clients
let mainPrisma = globalForPrisma.prisma || mainPrismaClient();
let fallbackPrisma = globalForPrisma.fallbackPrisma || fallbackPrismaClient();

// Set up development persistence
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = mainPrisma;
  globalForPrisma.fallbackPrisma = fallbackPrisma;
  globalForPrisma.isUsingFallback = false;
}

// Track whether we're using fallback
isUsingFallback = globalForPrisma.isUsingFallback || false;

// Function to check database health and switch to fallback if needed
export const checkDatabaseConnection = async (forceFallback = false): Promise<boolean> => {
  // Skip checks in production - just return current state
  if (process.env.NODE_ENV === 'production') {
    return isConnected;
  }
  
  // If we're already connected and not forcing a check, return current state
  if (isConnected && !forceFallback) {
    return true;
  }

  console.log('Checking database connection health...');
  
  // Try the main database first (unless we're forcing fallback)
  if (!forceFallback) {
    // Try multiple times with increasing delay
    for (let attempt = 0; attempt < CONNECTION_RETRY_ATTEMPTS; attempt++) {
      try {
        // Simple query to check database connectivity
        await mainPrisma.$queryRaw`SELECT 1`;
        
        // If we were using fallback, switch back to main
        if (isUsingFallback) {
          console.log('Main database is now available, switching back from fallback');
          isUsingFallback = false;
          globalForPrisma.isUsingFallback = false;
        }
        
        isConnected = true;
        console.log('Main database connection successful');
        return true;
      } catch (error: any) {
        console.error(`Main database check failed (attempt ${attempt + 1}/${CONNECTION_RETRY_ATTEMPTS}):`, error.message);
        
        // If not the last attempt, wait before retrying
        if (attempt < CONNECTION_RETRY_ATTEMPTS - 1 && !isFallbackEnabled()) {
          const delay = CONNECTION_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (isFallbackEnabled()) {
          // If fallback is enabled, break early and try fallback
          console.log('Trying fallback database...');
          break;
        }
      }
    }
  }
  
  // If we get here and fallback is enabled, try the fallback
  if (isFallbackEnabled() && fallbackPrisma) {
    try {
      // Verify SQLite is working properly first
      if (!isSqliteFallbackReady()) {
        console.error('SQLite fallback database is not accessible');
        return false;
      }
      
      // Test the fallback connection through Prisma
      await fallbackPrisma.$queryRaw`SELECT 1`;
      
      // Mark that we're using fallback
      isUsingFallback = true;
      globalForPrisma.isUsingFallback = true;
      
      console.log('Using SQLite fallback database');
      return true;
    } catch (fallbackError) {
      console.error('Fallback database also unavailable:', fallbackError);
    }
  }
  
  // If we get here, both main and fallback failed
  isConnected = false;
  return false;
};

// Expose whether we're using fallback database
export const isUsingFallbackDatabase = () => isUsingFallback;

// Get the appropriate client based on current status
export const getPrismaClient = () => {
  return isUsingFallback && fallbackPrisma ? fallbackPrisma : mainPrisma;
};

// Diagnostic function to help identify connection issues
export async function diagnoseConnectionIssue(): Promise<string> {
  try {
    console.log('Running database connection diagnostics...');
    
    // Create a detailed diagnostics report
    let report = 'Database Diagnostics Report:\n';
    
    // Check environment settings
    report += `\nEnvironment: ${process.env.NODE_ENV}`;
    report += `\nFallback Enabled: ${isFallbackEnabled()}`;
    report += `\nCurrently Using Fallback: ${isUsingFallback}`;
    
    // Try connecting to main database
    report += '\n\nMain Database:';
    try {
      await mainPrisma.$queryRaw`SELECT 1`;
      report += '\n - Connection: SUCCESS';
    } catch (error) {
      report += '\n - Connection: FAILED';
      report += `\n - Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    // Try connecting to fallback if available
    if (fallbackPrisma) {
      report += '\n\nFallback Database:';
      try {
        await fallbackPrisma.$queryRaw`SELECT 1`;
        report += '\n - Connection: SUCCESS';
      } catch (error) {
        report += '\n - Connection: FAILED';
        report += `\n - Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      report += '\n\nFallback Database: Not configured';
    }
    
    console.log('Diagnostics complete');
    return report;
  } catch (error) {
    return `Diagnostics error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Initialize connection - don't block startup, but check connection
Promise.resolve().then(() => {
  checkDatabaseConnection()
    .then(connected => {
      if (connected) {
        console.log(`Database connection successful${isUsingFallback ? ' (using SQLite fallback)' : ''}`);
      } else {
        console.error('All database connections failed');
      }
    })
    .catch(err => {
      console.error('Error during initial database check:', err);
    });
});

// Handle graceful shutdowns
process.on('beforeExit', async () => {
  if (mainPrisma) await mainPrisma.$disconnect();
  if (fallbackPrisma) await fallbackPrisma.$disconnect();
});

// Export the actual client getter function as the default
const prisma = getPrismaClient();
export default prisma;

// Export a function to get connection status
export function getDatabaseStatus() {
  return {
    isConnected,
    isUsingFallback,
    connectionErrors,
    lastError: lastConnectionError,
    mainUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/([^:]+):[^@]+@/, '//****:****@') : null,
    fallbackEnabled: isFallbackEnabled(),
  };
}
