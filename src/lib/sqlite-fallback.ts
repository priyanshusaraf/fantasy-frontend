/**
 * SQLite Fallback Database Helper
 * 
 * This provides a simple local SQLite database that can be used as a fallback
 * when the main database is unavailable.
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Define the path for the SQLite database
const DB_PATH = path.join(process.cwd(), 'data', 'fallback.sqlite');

// Ensure the data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory at ${dataDir}`);
    } catch (error) {
      console.error(`Failed to create data directory at ${dataDir}:`, error);
      throw error;
    }
  }
}

// Initialize the SQLite database with basic schema
export function initSqliteFallback() {
  try {
    console.log('Initializing SQLite fallback database...');
    console.log(`SQLite DB path: ${DB_PATH}`);
    ensureDataDir();
    
    // Create database connection
    const db = new Database(DB_PATH);
    
    // Create basic tables for authentication
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'USER',
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        token_type TEXT,
        expires_at INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        expires TIMESTAMP NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    
    // Add admin user if doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    
    if (!adminExists) {
      console.log(`Creating default admin user in fallback database with email: ${adminEmail}`);
      db.prepare(`
        INSERT INTO users (email, username, password, role, name)
        VALUES (?, ?, ?, 'ADMIN', 'Admin User')
      `).run(
        adminEmail, 
        'admin', 
        // In a real app, would use a proper hashing library
        process.env.ADMIN_PASSWORD || 'adminpass123'
      );
    }
    
    // Clean up database connection
    db.close();
    console.log('SQLite fallback database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize SQLite fallback database:', error);
    return false;
  }
}

// Test the database connection
export function testSqliteConnection(): boolean {
  try {
    console.log('Testing SQLite connection...');
    ensureDataDir();
    const db = new Database(DB_PATH);
    const result = db.prepare('SELECT 1 as test').get() as { test: number };
    db.close();
    
    if (result && result.test === 1) {
      console.log('SQLite connection test successful');
      return true;
    } else {
      console.error('SQLite connection test failed: Unexpected result:', result);
      return false;
    }
  } catch (error) {
    console.error('SQLite connection test failed with error:', error);
    
    // More detailed logging for specific error types
    if (error instanceof Error) {
      if (error.message.includes('SQLITE_CANTOPEN')) {
        console.error(`Cannot open database file at ${DB_PATH}. Check permissions and path.`);
      } else if (error.message.includes('SQLITE_NOTADB')) {
        console.error(`File at ${DB_PATH} is not a valid SQLite database. Consider removing it.`);
        try {
          if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
            console.log(`Removed invalid database file at ${DB_PATH}`);
          }
        } catch (removeError) {
          console.error('Failed to remove invalid database file:', removeError);
        }
      }
    }
    
    return false;
  }
}

// Initialize the database when this module is imported
if (process.env.NODE_ENV === 'development') {
  console.log('Auto-initializing SQLite fallback database in development mode');
  initSqliteFallback();
} 