import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "./db";

interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role?: "user" | "admin";
  createdAt?: Date;
}

export async function registerUser(userData: User) {
  const connection = await connectToDatabase();

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Prepare user data
    const newUser = {
      ...userData,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    };

    // Insert user into database
    const [result] = await connection.execute(
      "INSERT INTO users (username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?)",
      [
        newUser.username,
        newUser.email,
        newUser.password,
        newUser.role,
        newUser.createdAt,
      ]
    );

    return result;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function loginUser(email: string, password: string) {
  const connection = await connectToDatabase();

  try {
    // Cast the query result as an array of User objects
    const [users] = (await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    )) as [User[], any];

    if (!users || users.length === 0) {
      throw new Error("User not found");
    }

    const user = users[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function resetPassword(email: string, newPassword: string) {
  const connection = await connectToDatabase();

  try {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await connection.execute("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    return true;
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}
