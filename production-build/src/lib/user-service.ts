// src/lib/user-service.ts
import bcrypt from "bcryptjs";
import prisma from "./db";

export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string | null; // Optional for OAuth users
  role:
    | "USER"
    | "PLAYER"
    | "REFEREE"
    | "TOURNAMENT_ADMIN"
    | "MASTER_ADMIN"
    | "ORGANIZER";
  isApproved: boolean;
  profileImage?: string | null;
  createdAt?: Date;
}

export interface UserListResult {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export class UserService {
  private static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  public static async createUser(
    userData: Omit<User, "id" | "createdAt">
  ): Promise<number> {
    try {
      // Validate input
      if (!userData.username || !userData.email) {
        throw new Error("Username and email are required");
      }

      // Hash password if it exists
      const hashedPassword = userData.password
        ? await this.hashPassword(userData.password)
        : null;

      // Create user with Prisma
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          role: userData.role || "USER",
          isVerified: false,
          createdAt: new Date(),
        },
      });

      return user.id;
    } catch (error) {
      console.error("User creation error:", error);
      throw error;
    }
  }

  public static async findByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Find user by email error:", error);
      throw error;
    }
  }

  public static async getUserById(id: number): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isApproved: true,
          isVerified: true,
          createdAt: true,
          profileImage: true,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  }

  public static async updateUser(id: number, updateData: Partial<User>) {
    try {
      // Handle password hashing if password is being updated
      if (updateData.password) {
        updateData.password = await this.hashPassword(updateData.password);
      }

      // Remove the 'id' property if present, since it should not be updated
      const { id: _, ...data } = updateData;

      const updatedUser = await prisma.user.update({
        where: { id },
        data,
      });

      return updatedUser;
    } catch (error) {
      console.error("User update error:", error);
      throw error;
    }
  }

  public static async deleteUser(id: number): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("User deletion error:", error);
      throw error;
    }
  }

  public static async listUsers(page = 1, limit = 10): Promise<UserListResult> {
    try {
      const offset = (page - 1) * limit;

      // Get users
      const users = await prisma.user.findMany({
        take: limit,
        skip: offset,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isApproved: true,
          isVerified: true,
          createdAt: true,
          profileImage: true,
        },
      });

      // Get total count
      const total = await prisma.user.count();

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("List users error:", error);
      throw error;
    }
  }

  public static async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || user.password === null) return null;

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);

      return isMatch ? user : null;
    } catch (error) {
      console.error("Credential verification error:", error);
      throw error;
    }
  }
}
