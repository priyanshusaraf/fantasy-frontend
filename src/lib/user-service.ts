// src/lib/user-service.ts
import mysql, { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./db";

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string | null;
  role?: "user" | "admin";
  profileImage?: string | null;
  isVerified?: boolean;
  createdAt?: Date;
}

export class UserService {
  public static async createUser(
    userData: Omit<User, "id" | "createdAt">
  ): Promise<number> {
    const connection = await connectToDatabase();

    try {
      // Hash password if it exists
      let hashedPassword = userData.password;
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(userData.password, salt);
      }

      // Prepare user data
      const newUser = {
        ...userData,
        password: hashedPassword,
        role: userData.role || "user",
        isVerified: false,
        createdAt: new Date(),
      };

      // Insert user into database
      const [result] = await connection.execute<mysql.OkPacket>(
        "INSERT INTO users (username, email, password, role, isVerified, createdAt, profileImage) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          newUser.username,
          newUser.email,
          newUser.password,
          newUser.role,
          newUser.isVerified,
          newUser.createdAt,
          newUser.profileImage || null,
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error("User creation error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  public static async findByEmail(email: string): Promise<User | null> {
    const connection = await connectToDatabase();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      return rows.length > 0 ? (rows[0] as User) : null;
    } catch (error) {
      console.error("Find user by email error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  public static async getUserById(id: number): Promise<User | null> {
    const connection = await connectToDatabase();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT id, username, email, role, isVerified, createdAt, profileImage FROM users WHERE id = ?",
        [id]
      );

      return rows.length > 0 ? (rows[0] as User) : null;
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  public static async updateUser(id: number, updateData: Partial<User>) {
    const connection = await connectToDatabase();

    try {
      // Handle password hashing if password is being updated
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      // Explicitly type-safe key filtering
      const updateFields: (keyof User)[] = [
        "username",
        "email",
        "password",
        "role",
        "profileImage",
        "isVerified",
      ];

      const fieldsToUpdate = updateFields.filter(
        (key) => updateData[key] !== undefined
      );

      const sqlSetClauses = fieldsToUpdate
        .map((field) => `${String(field)} = ?`)
        .join(", ");

      const values = fieldsToUpdate.map((field) => updateData[field]);
      values.push(id);

      const query = `UPDATE users SET ${sqlSetClauses} WHERE id = ?`;

      await connection.execute<mysql.OkPacket>(query, values);

      return this.getUserById(id);
    } catch (error) {
      console.error("User update error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  public static async deleteUser(id: number): Promise<boolean> {
    const connection = await connectToDatabase();

    try {
      const [result] = await connection.execute<mysql.OkPacket>(
        "DELETE FROM users WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("User deletion error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  public static async listUsers(page = 1, limit = 10) {
    const connection = await connectToDatabase();

    try {
      const offset = (page - 1) * limit;

      // Get users
      const [users] = await connection.execute<RowDataPacket[]>(
        "SELECT id, username, email, role, isVerified, createdAt, profileImage FROM users LIMIT ? OFFSET ?",
        [limit, offset]
      );

      // Get total count
      const [countResult] = await connection.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM users"
      );
      const total = countResult[0]["total"];

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("List users error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  public static async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const connection = await connectToDatabase();

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (!rows || rows.length === 0) return null;

      const user = rows[0] as User;

      // For Google OAuth users, password might be null
      if (user.password === null) return null;

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);

      return isMatch ? user : null;
    } catch (error) {
      console.error("Credential verification error:", error);
      throw error;
    } finally {
      await connection.end();
    }
  }
}
