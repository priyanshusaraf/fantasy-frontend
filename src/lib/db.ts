// src/lib/db.ts
import mysql from "mysql2/promise";

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "your_database_name",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function connectToDatabase() {
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

// Optional: Export the pool for more advanced use cases
export const dbPool = pool;
