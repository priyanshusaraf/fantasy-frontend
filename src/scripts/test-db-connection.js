/**
 * Direct Database Connection Test
 * 
 * This script bypasses Prisma and tests direct database connectivity
 * to diagnose connection issues with the MySQL database.
 * 
 * Run with: node src/scripts/test-db-connection.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

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
      connectionLimit: parseInt(searchParams.get('connection_limit') || '10')
    };
  } catch (error) {
    console.error('Error parsing database URL:', error);
    return null;
  }
};

// Test connecting to the database
const testConnection = async (config) => {
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
    
    console.log('Testing database version...');
    const [versionRows] = await connection.execute('SELECT @@version as version');
    console.log('MySQL version:', versionRows[0].version);
    
    console.log('Checking max connections...');
    const [maxConRows] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
    console.log('Max connections:', maxConRows[0].Value);
    
    console.log('Checking current connections...');
    const [currentConRows] = await connection.execute('SELECT COUNT(*) as count FROM information_schema.PROCESSLIST');
    console.log('Current connections:', currentConRows[0].count);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Connection failed with error:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL state:', error.sqlState);
    
    // Provide detailed troubleshooting guidance based on the error
    switch(error.code) {
      case 'ENOTFOUND':
        console.error('TROUBLESHOOTING: Host not found. Check if the hostname is correct and accessible from your network.');
        break;
      case 'ECONNREFUSED':
        console.error('TROUBLESHOOTING: Connection refused. The database server might be down or a firewall is blocking access.');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('TROUBLESHOOTING: Access denied. Username or password is incorrect.');
        break;
      case 'ER_DBACCESS_DENIED_ERROR':
        console.error('TROUBLESHOOTING: Database access denied. The user does not have access to the specified database.');
        break;
      case 'ER_BAD_DB_ERROR':
        console.error('TROUBLESHOOTING: Database does not exist. The specified database name is incorrect.');
        break;
      case 'ETIMEDOUT':
        console.error('TROUBLESHOOTING: Connection timed out. The database server might be down or network issue.');
        break;
      case 'PROTOCOL_CONNECTION_LOST':
        console.error('TROUBLESHOOTING: Connection lost. The database server closed the connection.');
        break;
      default:
        console.error('TROUBLESHOOTING: General connection error. Check your network, VPN settings, and database server status.');
    }
    return false;
  }
};

// Check if the database server is reachable
const checkHostReachable = async (host, port) => {
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;
    
    socket.setTimeout(5000); // 5 second timeout
    
    socket.on('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, host);
  });
};

// Test connection with SSL disabled
const testWithoutSSL = async (config) => {
  const noSslConfig = { ...config, ssl: false };
  console.log('\nTesting connection WITHOUT SSL...');
  return await testConnection(noSslConfig);
};

// Main function
async function main() {
  try {
    console.log('Database Connection Diagnostic Script');
    console.log('====================================\n');
    
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('DATABASE_URL not found in environment');
      process.exit(1);
    }
    
    console.log(`Found DATABASE_URL: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);
    
    const config = parseDbUrl(databaseUrl);
    
    if (!config) {
      console.error('Failed to parse DATABASE_URL');
      process.exit(1);
    }
    
    // Check host reachability first
    console.log(`\nChecking if host ${config.host}:${config.port} is reachable...`);
    const isReachable = await checkHostReachable(config.host, config.port);
    
    if (!isReachable) {
      console.error(`Host ${config.host}:${config.port} is not reachable.`);
      console.error('TROUBLESHOOTING: Check your network connection, VPN settings, or if the database server is online.');
      process.exit(1);
    }
    
    console.log(`Host ${config.host}:${config.port} is reachable.`);
    
    // Try with original config
    let success = await testConnection(config);
    
    // If failed and SSL is enabled, try without SSL
    if (!success && config.ssl) {
      success = await testWithoutSSL(config);
    }
    
    // Final status
    if (success) {
      console.log('\nDiagnostics completed successfully! Your database connection is working.');
    } else {
      console.error('\nAll connection attempts failed. Please review the error messages above for troubleshooting guidance.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 