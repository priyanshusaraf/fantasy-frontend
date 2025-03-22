import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().optional().default("not-used"),
    GOOGLE_CLIENT_SECRET: z.string().optional().default("not-used"),
    JWT_SECRET: z.string().min(1),
    ADMIN_KEY: z.string().min(1),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional().default("not-used"),
    EMAIL_SERVER_HOST: z.string().optional(),
    EMAIL_SERVER_PORT: z.string().optional(),
    EMAIL_SERVER_USER: z.string().optional(),
    EMAIL_SERVER_PASSWORD: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    BYPASS_RAZORPAY: z.string().transform((val) => val === "true" || val === "" ? true : false),
    POLLING_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(2000),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_POLLING_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(2000),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "not-used",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "not-used",
    JWT_SECRET: process.env.JWT_SECRET,
    ADMIN_KEY: process.env.ADMIN_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "not-used",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "not-used",
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "not-used",
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || "",
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || "587",
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || "",
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || "",
    EMAIL_FROM: process.env.EMAIL_FROM || "noreply@example.com",
    BYPASS_RAZORPAY: process.env.BYPASS_RAZORPAY || "true",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    POLLING_INTERVAL_MS: process.env.POLLING_INTERVAL_MS || "15000",
    NEXT_PUBLIC_POLLING_INTERVAL_MS: process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS || "15000",
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
}); 