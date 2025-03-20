import { z } from 'zod';

export interface RegistrationData {
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface PasswordResetData {
  email: string;
  newPassword: string;
  resetToken: string;
}

export function validateRegistration(userData: RegistrationData) {
  const errors: { [key: string]: string } = {};

  if (!userData.username || userData.username.length < 3) {
    errors.username = "Username must be at least 3 characters long";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!userData.email || !emailRegex.test(userData.email)) {
    errors.email = "Invalid email address";
  }

  if (!userData.password || userData.password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  }

  const passwordStrengthRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (userData.password && !passwordStrengthRegex.test(userData.password)) {
    errors.passwordStrength =
      "Password must include uppercase, lowercase, number, and special character";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateUserUpdate(userData: UserUpdateData) {
  const errors: { [key: string]: string } = {};

  if (userData.username && userData.username.length < 3) {
    errors.username = "Username must be at least 3 characters long";
  }

  if (userData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.email = "Invalid email address";
    }
  }

  if (userData.password) {
    if (userData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    const passwordStrengthRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(userData.password)) {
      errors.passwordStrength =
        "Password must include uppercase, lowercase, number, and special character";
    }
  }

  if (userData.role && !["user", "admin"].includes(userData.role)) {
    errors.role = 'Invalid role. Must be "user" or "admin"';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validatePasswordReset(data: PasswordResetData) {
  const errors: { [key: string]: string } = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "Invalid email address";
  }

  if (!data.newPassword || data.newPassword.length < 8) {
    errors.newPassword = "New password must be at least 8 characters long";
  }

  const passwordStrengthRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (data.newPassword && !passwordStrengthRegex.test(data.newPassword)) {
    errors.passwordStrength =
      "New password must include uppercase, lowercase, number, and special character";
  }

  if (!data.resetToken) {
    errors.resetToken = "Reset token is required";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// User authentication validation schemas
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const updatePasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

// Base tournament schema without refinements
const baseTournamentSchema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters" }),
  description: z.string().optional(),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid start date format" }
  ),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid end date format" }
  ),
  registrationOpenDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid registration open date format" }
  ),
  registrationCloseDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid registration close date format" }
  ),
  location: z.string().optional(),
  type: z.string(),
  status: z.string().default("UPCOMING"),
  maxPlayers: z.number().int().positive().optional(),
  entryFee: z.number().nonnegative().optional(),
  prize: z.number().nonnegative().optional(),
});

// Tournament validation schemas with refinements
export const createTournamentSchema = baseTournamentSchema.refine(
  (data) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const startDate = new Date(data.startDate);
    const registrationCloseDate = new Date(data.registrationCloseDate);
    return registrationCloseDate <= startDate;
  },
  {
    message: "Registration close date must be before or equal to tournament start date",
    path: ["registrationCloseDate"],
  }
);

export const updateTournamentSchema = baseTournamentSchema.partial();

// Player validation schemas
export const createPlayerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  age: z.number().int().positive().optional(),
  country: z.string().optional(),
  skillLevel: z.string().optional(),
  dominantHand: z.enum(["LEFT", "RIGHT", "AMBIDEXTROUS"]).optional(),
  imageUrl: z.string().url().optional(),
  bio: z.string().optional(),
});

export const updatePlayerSchema = createPlayerSchema.partial();

// Payment validation schemas
export const createOrderSchema = z.object({
  tournamentId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
});

// Utility function to validate data against schema
export function validateData<T>(schema: z.ZodType<T>, data: unknown): { 
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
      return {
        success: false,
        error: errorMessage
      };
    }
    return {
      success: false,
      error: 'Validation failed'
    };
  }
}
