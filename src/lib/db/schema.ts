import { z } from "zod";

// Enum Schemas
export const UserRoleEnum = z.enum([
  "PLAYER",
  "REFEREE",
  "TOURNAMENT_ADMIN",
  "MASTER_ADMIN",
  "ORGANIZER",
]);

export const TournamentTypeEnum = z.enum([
  "SINGLES",
  "DOUBLES",
  "MIXED_DOUBLES",
  "ROUND_ROBIN",
  "KNOCKOUT",
  "LEAGUE",
]);

export const TournamentStatusEnum = z.enum([
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const PlayerSkillLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "PROFESSIONAL",
]);

export const MatchStatusEnum = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

// Base User Schema
export const UserSchema = z.object({
  id: z.number().int().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  role: UserRoleEnum.default("PLAYER"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Profile Schema
export const ProfileSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int(),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  dateOfBirth: z.date(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  profilePicture: z.string().url().optional(),
});

// Player Schema
export const PlayerSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int(),
  skillLevel: PlayerSkillLevelEnum,
  ranking: z.number().int(),
  totalPoints: z.number().int().default(0),
});

// Referee Schema
export const RefereeSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int(),
  certificationLevel: z
    .string()
    .min(1, { message: "Certification level is required" }),
});

// Tournament Schema
export const TournamentSchema = z
  .object({
    id: z.number().int().optional(),
    name: z
      .string()
      .min(3, { message: "Tournament name must be at least 3 characters" }),
    description: z.string().optional(),
    type: TournamentTypeEnum,
    status: TournamentStatusEnum,
    startDate: z.date(),
    endDate: z.date(),
    registrationOpenDate: z.date(),
    registrationCloseDate: z.date(),
    location: z.string().min(1, { message: "Location is required" }),
    maxParticipants: z
      .number()
      .int()
      .min(2, { message: "At least 2 participants required" }),
    entryFee: z.number().nonnegative(),
    prizeMoney: z.number().nonnegative().optional(),
    organizerId: z.number().int(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((data) => data.registrationCloseDate <= data.startDate, {
    message: "Registration close date must be before tournament start date",
    path: ["registrationCloseDate"],
  });

// Tournament Entry Schema
export const TournamentEntrySchema = z.object({
  id: z.number().int().optional(),
  tournamentId: z.number().int(),
  playerId: z.number().int(),
  registeredAt: z.date().optional(),
  paymentStatus: PaymentStatusEnum.default("PENDING"),
});

// Match Schema
export const MatchSchema = z.object({
  id: z.number().int().optional(),
  tournamentId: z.number().int(),
  refereeId: z.number().int(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: MatchStatusEnum,
  team1Id: z.number().int(),
  team2Id: z.number().int(),
  score: z.string().optional(),
  winnerId: z.number().int().optional(),
});

// Team Schema
export const TeamSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, { message: "Team name is required" }),
});

// Match Performance Schema
export const MatchPerformanceSchema = z.object({
  id: z.number().int().optional(),
  matchId: z.number().int(),
  playerId: z.number().int(),
  points: z.number().int(),
  aces: z.number().int(),
  faults: z.number().int(),
  winningShots: z.number().int(),
  otherStats: z.record(z.unknown()).optional(),
});

// Fantasy Team Schema
export const FantasyTeamSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1, { message: "Fantasy team name is required" }),
  playerId: z.number().int(),
  totalPoints: z.number().int().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Error Formatting Utility
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errorMessages: Record<string, string> = {};

  error.errors.forEach((err) => {
    // Convert path array to dot notation string
    const path = err.path.join(".");
    errorMessages[path] = err.message;
  });

  return errorMessages;
}

// Type Exports
export type User = z.infer<typeof UserSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Referee = z.infer<typeof RefereeSchema>;
export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentEntry = z.infer<typeof TournamentEntrySchema>;
export type Match = z.infer<typeof MatchSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type MatchPerformance = z.infer<typeof MatchPerformanceSchema>;
export type FantasyTeam = z.infer<typeof FantasyTeamSchema>;

// Input Types (for creation/update)
export type CreateUserInput = z.input<typeof UserSchema>;
export type UpdateUserInput = Partial<CreateUserInput>;
