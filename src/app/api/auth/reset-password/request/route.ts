import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generatePasswordResetToken } from "@/lib/jwt";
import { z } from "zod";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const prisma = new PrismaClient();

// Define validation schema
const requestSchema = z.object({
  email: z.string().email(),
});

// Create email transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_SERVER_HOST || "smtp.gmail.com",
  port: Number(env.EMAIL_SERVER_PORT || "587"),
  secure: (env.EMAIL_SERVER_PORT || "") === "465",
  auth: {
    user: env.EMAIL_SERVER_USER,
    pass: env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    
    const { email } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security reasons, don't reveal if the email exists
    if (!user) {
      return NextResponse.json({
        message: "If your email is registered, you will receive a password reset link",
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user.id, user.email);

    // Create reset link
    const resetLink = `${env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: env.EMAIL_FROM || '"Final Fantasy App" <noreply@finalfantasyapp.com>',
      to: user.email,
      subject: "Password Reset Request",
      text: `Please use the following link to reset your password: ${resetLink}. This link will expire in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name || user.username || ''},</p>
          <p>We received a request to reset your password. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>Final Fantasy App Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "If your email is registered, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
} 