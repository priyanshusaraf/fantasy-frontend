/**
 * Direct Database Connection Test
 * 
 * This script bypasses Prisma and tests direct database connectivity
 * to diagnose connection issues with the MySQL database.
 * 
 * Run with: node src/scripts/test-db-connection.mjs
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import net from 'net';
import { promisify } from 'util';
import dns from 'dns';

// Setup environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

// DNS lookup promise
const dnsLookup = promisify(dns.lookup);

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse the DATABASE_URL from .env.local
const parseDbUrl = (url) => {
  if (!url) return null;
  
  try {
    // Clean up the URL - remove quotes if present
    const cleanUrl = url.replace(/^["']|["']$/g, '');
    
    // Extract parts using URL constructor
    const parsedUrl = new URL(cleanUrl);
    
    // Get username and password from auth part
    const auth = parsedUrl.username ? {
      user: decodeURIComponent(parsedUrl.username),
      password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined
    } : {};
    
    // Extract database name from pathname
    const database = parsedUrl.pathname.replace(/^\//, '');
    
    // Parse query params for connection options
    const searchParams = parsedUrl.searchParams;
    const ssl = searchParams.get('ssl') === 'true';
    
    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port || '3306',
      ...auth,
      database,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      connectTimeout: parseInt(searchParams.get('connect_timeout') || '10000'),
      connectionLimit: parseInt(searchParams.get('connection_limit') || '10'),
      queryParams: Object.fromEntries(searchParams.entries())
    };
  } catch (error) {
    console.error('Error parsing database URL:', error);
    return null;
  }
};

// Test connecting to the database
const testDatabaseConnection = async (config, attempt = 1, maxAttempts = 3) => {
  console.log(`Connection attempt ${attempt}/${maxAttempts}:`);
  console.log('Testing database connection with the following config:');
  // Don't log password
  const sanitizedConfig = { ...config, password: config.password ? '******' : undefined };
  console.log(JSON.stringify(sanitizedConfig, null, 2));
  
  try {
    console.log('Creating connection...');
    const connection = await mysql.createConnection(config);
    
    console.log('Running test query...');
    const [rows] = await connection.execute('SELECT 1 as result');
    
    console.log('Query result:', rows);
    console.log('Connection successful!');
    
    // Get additional information if connected
    console.log('\n=== Database Server Information ===');
    
    console.log('Testing database version...');
    const [versionRows] = await connection.execute('SELECT @@version as version');
    console.log('MySQL version:', versionRows[0].version);
    
    console.log('Checking max connections...');
    const [maxConRows] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
    console.log('Max connections:', maxConRows[0].Value);
    
    console.log('Checking current connections...');
    const [currentConRows] = await connection.execute('SELECT COUNT(*) as count FROM information_schema.PROCESSLIST');
    console.log('Current connections:', currentConRows[0].count);
    
    // Additional connection timeout settings
    console.log('\nChecking timeout settings...');
    const timeoutVariables = [
      'connect_timeout',
      'wait_timeout', 
      'interactive_timeout',
      'net_read_timeout',
      'net_write_timeout'
    ];
    
    for (const variable of timeoutVariables) {
      const [result] = await connection.execute(`SHOW VARIABLES LIKE '${variable}'`);
      if (result.length > 0) {
        console.log(`${variable}: ${result[0].Value} seconds`);
      }
    }
    
    await connection.end();
    return true;
  } catch (error) {
    console.error(`\nConnection failed with error (attempt ${attempt}/${maxAttempts}):`, error.message);
    console.error('Error code:', error.code);
    console.error('SQL state:', error.sqlState || 'N/A');
    
    // Enhanced troubleshooting based on specific error codes
    const errorDetails = {
      success: false,
      errorCode: error.code,
      errorMessage: error.message,
      sqlState: error.sqlState,
      recommendation: ''
    };
    
    // Provide detailed troubleshooting guidance based on the error
    switch(error.code) {
      case 'ENOTFOUND':
        errorDetails.recommendation = 'Host not found. The hostname might be incorrect or DNS resolution is failing.';
        console.error('TROUBLESHOOTING: Host not found. Check if the hostname is correct and accessible from your network.');
        break;
      case 'ECONNREFUSED':
        errorDetails.recommendation = 'Connection refused. The server might be down, or a firewall is blocking the connection.';
        console.error('TROUBLESHOOTING: Connection refused. The database server might be down or a firewall is blocking access.');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        errorDetails.recommendation = 'Access denied. Username or password is incorrect.';
        console.error('TROUBLESHOOTING: Access denied. Username or password is incorrect.');
        break;
      case 'ER_DBACCESS_DENIED_ERROR':
        errorDetails.recommendation = 'Database access denied. User does not have permission to access the database.';
        console.error('TROUBLESHOOTING: Database access denied. The user does not have access to the specified database.');
        break;
      case 'ER_BAD_DB_ERROR':
        errorDetails.recommendation = 'Database does not exist. The specified database name is incorrect.';
        console.error('TROUBLESHOOTING: Database does not exist. The specified database name is incorrect.');
        break;
      case 'ETIMEDOUT':
        errorDetails.recommendation = 'Connection timed out. The database server might be down or there might be network issues.';
        console.error('TROUBLESHOOTING: Connection timed out. The database server might be down or network issue.');
        break;
      case 'ECONNRESET':
        errorDetails.recommendation = 'Connection reset by the server. This could be due to network issues or security settings.';
        console.error('TROUBLESHOOTING: Connection reset. This might be due to network instability or server security policies.');
        break;
      case 'PROTOCOL_CONNECTION_LOST':
        errorDetails.recommendation = 'Connection lost. The database server closed the connection.';
        console.error('TROUBLESHOOTING: Connection lost. The database server closed the connection.');
        break;
      case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
        errorDetails.recommendation = 'Connection error after a fatal error. Try reconnecting after a few seconds.';
        console.error('TROUBLESHOOTING: Fatal connection error. Try reconnecting after a few seconds.');
        break;
      case 'ER_CON_COUNT_ERROR':
        errorDetails.recommendation = 'Too many connections. The server has reached its maximum connection limit.';
        console.error('TROUBLESHOOTING: Too many connections. Consider increasing max_connections on the server or reducing connection_limit in your connection string.');
        break;
      default:
        errorDetails.recommendation = 'General connection error. Check your network, VPN settings, and database server status.';
        console.error('TROUBLESHOOTING: General connection error. Check your network, VPN settings, and database server status.');
    }
    
    // Try again if we haven't reached max attempts
    if (attempt < maxAttempts) {
      console.log(`\nRetrying connection in 2 seconds... (Attempt ${attempt+1}/${maxAttempts})`);
      await sleep(2000);
      return testDatabaseConnection(config, attempt + 1, maxAttempts);
    }
    
    return errorDetails;
  }
};

// Check if the database server is reachable
const checkHostReachable = async (host, port) => {
  console.log(`Attempting to resolve host ${host}...`);
  
  try {
    // First try to resolve the hostname
    const dnsResult = await dnsLookup(host);
    console.log(`DNS resolution successful: ${host} -> ${dnsResult.address}`);
    
    // Now try to connect to the port
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000); // 5 second timeout
      
      socket.on('connect', () => {
        console.log(`Successfully connected to ${host}:${port}`);
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        console.error(`Connection to ${host}:${port} timed out`);
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', (err) => {
        console.error(`Connection error to ${host}:${port}: ${err.message}`);
        socket.destroy();
        resolve(false);
      });
      
      console.log(`Attempting to connect to ${host}:${port}...`);
      socket.connect(port, host);
    });
  } catch (error) {
    console.error(`Failed to resolve host ${host}: ${error.message}`);
    return false;
  }
};

// Test connection with SSL disabled
const testWithoutSSL = async (config) => {
  const noSslConfig = { ...config, ssl: false };
  console.log('\nTesting connection WITHOUT SSL...');
  return await testDatabaseConnection(noSslConfig);
};

// Test connection with different connection parameters
const testWithDifferentParams = async (originalConfig) => {
  console.log('\nTesting with modified connection parameters...');
  
  // Test with longer timeout
  const longerTimeoutConfig = { 
    ...originalConfig, 
    connectTimeout: 30000,  // 30 seconds
    timeout: 30000
  };
  console.log('\nTesting with longer timeout (30s)...');
  const longerTimeoutResult = await testDatabaseConnection(longerTimeoutConfig);
  
  if (longerTimeoutResult) {
    return true;
  }
  
  // More attempts might be added here as needed
  return false;
};

// Reset RDS connections function
async function resetRDSConnections(config) {
  try {
    // Create connection to mysql database (not the app database)
    console.log('\nAttempting to connect to MySQL to kill idle connections...');
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: 'mysql', // Connect to the mysql database instead
      ssl: config.ssl,
      connectTimeout: 60000 // 60 seconds timeout
    });
    
    // Get a list of idle connections
    console.log('Fetching idle connections...');
    const [processes] = await connection.execute(`
      SELECT id, user, host, db, command, time, state
      FROM information_schema.processlist
      WHERE db = ? AND command = 'Sleep' AND time > 10
    `, [config.database]);
    
    console.log(`Found ${processes.length} idle connections to kill`);
    
    // Kill each idle connection
    let killedCount = 0;
    for (const process of processes) {
      try {
        console.log(`Killing connection id ${process.id} (${process.user}@${process.host}, idle for ${process.time}s)`);
        await connection.execute(`KILL ${process.id}`);
        killedCount++;
      } catch (killError) {
        console.error(`Failed to kill connection ${process.id}:`, killError.message);
      }
    }
    
    console.log(`Successfully killed ${killedCount} idle connections`);
    await connection.end();
    return true;
  } catch (error) {
    console.error('Failed to reset connections:', error.message);
    return false;
  }
}

// Update .env file with increased timeouts
async function updateEnvFile() {
  try {
    const envPath = path.join(projectRoot, '.env.local');
    console.log(`\nUpdating connection parameters in ${envPath}...`);
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    const databaseUrlMatch = envContent.match(/^DATABASE_URL="([^"]+)"/m);
    
    if (!databaseUrlMatch) {
      console.error('Could not find DATABASE_URL in .env.local');
      return false;
    }
    
    const currentUrl = databaseUrlMatch[1];
    const parsedUrl = parseDbUrl('mysql://' + currentUrl.split('mysql://')[1]);
    
    if (!parsedUrl) {
      console.error('Failed to parse current DATABASE_URL');
      return false;
    }
    
    // Build the new connection URL with updated parameters
    let newUrl = `mysql://${parsedUrl.user}:${parsedUrl.password}@${parsedUrl.host}:${parsedUrl.port}/${parsedUrl.database}?`;
    
    // Add or update query parameters
    const params = {
      'connection_limit': '5',
      'pool_timeout': '60000',
      'connect_timeout': '60000', 
      'socket_timeout': '60000',
      'ssl': 'true'
    };
    
    const queryParts = [];
    for (const [key, value] of Object.entries(params)) {
      queryParts.push(`${key}=${value}`);
    }
    
    newUrl += queryParts.join('&');
    
    // Replace the old URL with the new one
    const newEnvContent = envContent.replace(/^DATABASE_URL="[^"]+"/m, `DATABASE_URL="${newUrl}"`);
    
    // Write the updated content back to the file
    fs.writeFileSync(envPath, newEnvContent);
    console.log('Successfully updated DATABASE_URL with longer timeouts');
    
    return true;
  } catch (error) {
    console.error('Failed to update .env file:', error.message);
    return false;
  }
}

// Add reset command line argument handling
if (process.argv.includes('--reset')) {
  (async () => {
    console.log('Running database connection reset...');
    
    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL not found in environment variables');
      process.exit(1);
    }
    
    const parsedUrl = parseDbUrl(dbUrl);
    if (!parsedUrl) {
      console.error('Failed to parse DATABASE_URL');
      process.exit(1);
    }
    
    // Determine SSL setting from query params
    const sslEnabled = parsedUrl.queryParams?.ssl === 'true';
    const sslConfig = sslEnabled ? { rejectUnauthorized: false } : false;
    
    // Step 1: Try to reset connections if possible
    console.log('\n--- Attempting to optimize database connections ---');
    await resetRDSConnections({
      host: parsedUrl.host,
      port: parsedUrl.port,
      user: parsedUrl.user,
      password: parsedUrl.password,
      database: parsedUrl.database,
      ssl: sslConfig
    });
    
    // Step 2: Update environment file with longer timeouts
    await updateEnvFile();
    
    // Step 3: Test database connection with new settings
    console.log('\n--- Testing database connection with updated settings ---');
    const connectionConfig = {
      host: parsedUrl.host,
      port: parsedUrl.port,
      user: parsedUrl.user,
      password: parsedUrl.password,
      database: parsedUrl.database,
      ssl: sslConfig,
      connectTimeout: 60000, // 60 seconds
      timeout: 60000,
      connectionLimit: 5
    };
    
    const connectionSuccess = await testDatabaseConnection(connectionConfig);
    
    if (connectionSuccess) {
      console.log('\n✅ Database connection reset and optimization completed successfully!');
      process.exit(0);
    } else {
      console.error('\n❌ Failed to establish a database connection after reset attempts.');
      process.exit(1);
    }
  })();
}

// Main function
async function main() {
  try {
    console.log('Database Connection Diagnostic Script');
    console.log('====================================\n');
    
    // First test DATABASE_URL
    let databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('DATABASE_URL not found in environment');
      process.exit(1);
    }
    
    console.log(`Found DATABASE_URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);
    
    let config = parseDbUrl(databaseUrl);
    
    if (!config) {
      console.error('Failed to parse DATABASE_URL');
      process.exit(1);
    }
    
    // Check host reachability first
    console.log(`\nChecking if host ${config.host}:${config.port} is reachable...`);
    const isReachable = await checkHostReachable(config.host, config.port);
    
    if (!isReachable) {
      console.error(`\nHost ${config.host}:${config.port} is not reachable.`);
      console.error('TROUBLESHOOTING: Check your network connection, VPN settings, or if the database server is online.');
      
      // Check if we have a fallback database
      const fallbackUrl = process.env.FALLBACK_DATABASE_URL;
      
      if (fallbackUrl) {
        console.log('\nFound FALLBACK_DATABASE_URL. Trying fallback database instead...');
        
        const fallbackConfig = parseDbUrl(fallbackUrl);
        
        if (fallbackConfig) {
          console.log(`Testing connection to fallback database at ${fallbackConfig.host}:${fallbackConfig.port}...`);
          const fallbackResult = await testDatabaseConnection(fallbackConfig);
          
          if (fallbackResult) {
            console.log('\nFallback database connection is working!');
            console.log('RECOMMENDATION: Your main database connection is failing, but the fallback is working. Check that the main database server is running and accessible from your network.');
            process.exit(0);
          } else {
            console.error('\nBoth main and fallback database connections failed.');
            process.exit(1);
          }
        }
      } else {
        console.error('No fallback database URL found.');
        process.exit(1);
      }
    }
    
    console.log(`Host ${config.host}:${config.port} is reachable.`);
    
    // Try with original config
    let result = await testDatabaseConnection(config);
    
    // If failed and SSL is enabled, try without SSL
    if (!result && config.ssl) {
      result = await testWithoutSSL(config);
    }
    
    // If still failed, try with different parameters
    if (!result) {
      result = await testWithDifferentParams(config);
    }
    
    // Final status
    if (result) {
      console.log('\nDiagnostics completed successfully! Your database connection is working.');
      
      // Check fallback too if available
      const fallbackUrl = process.env.FALLBACK_DATABASE_URL;
      if (fallbackUrl) {
        console.log('\nChecking fallback database connection as well...');
        const fallbackConfig = parseDbUrl(fallbackUrl);
        
        if (fallbackConfig) {
          const fallbackResult = await testDatabaseConnection(fallbackConfig);
          if (fallbackResult) {
            console.log('Both main and fallback database connections are working!');
          } else {
            console.log('NOTE: Main database works, but fallback database connection failed.');
          }
        }
      }
    } else {
      console.error('\nAll connection attempts failed. Please review the error messages above for troubleshooting guidance.');
      console.error(`FINAL RECOMMENDATION: ${result.recommendation}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 