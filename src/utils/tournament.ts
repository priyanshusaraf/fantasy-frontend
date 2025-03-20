/**
 * Tournament utilities
 */

/**
 * Check if a tournament's registration is currently open
 * This strictly enforces the time component of the registration dates
 */
export function isRegistrationOpen(tournament: {
  status?: string;
  registrationOpenDate?: Date;
  registrationCloseDate?: Date;
}): boolean {
  // If tournament status is explicitly REGISTRATION_OPEN, return true
  if (tournament.status === "REGISTRATION_OPEN") {
    return true;
  }

  // If registration dates are not set, return false
  if (!tournament.registrationOpenDate || !tournament.registrationCloseDate) {
    return false;
  }

  const now = new Date();
  const registrationOpenDate = new Date(tournament.registrationOpenDate);
  const registrationCloseDate = new Date(tournament.registrationCloseDate);

  // Compare full timestamps (date + time)
  return now >= registrationOpenDate && now <= registrationCloseDate;
}

/**
 * Check if a tournament has started
 * This strictly enforces the time component of the start date
 */
export function hasTournamentStarted(tournament: {
  status?: string;
  startDate?: Date;
}): boolean {
  // If tournament status is explicitly IN_PROGRESS or COMPLETED, return true
  if (tournament.status === "IN_PROGRESS" || tournament.status === "COMPLETED") {
    return true;
  }

  // If start date is not set, return false
  if (!tournament.startDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(tournament.startDate);

  // Compare full timestamps (date + time)
  return now >= startDate;
}

/**
 * Check if a tournament entry is allowed
 * This checks both registration period and tournament status
 */
export function canRegisterForTournament(tournament: {
  status?: string;
  registrationOpenDate?: Date;
  registrationCloseDate?: Date;
  startDate?: Date;
  maxParticipants?: number;
  currentParticipants?: number;
}): {
  allowed: boolean;
  reason?: string;
} {
  // Check if registration is open
  if (!isRegistrationOpen(tournament)) {
    return {
      allowed: false,
      reason: "Registration is closed for this tournament"
    };
  }

  // Check if tournament has already started
  if (hasTournamentStarted(tournament)) {
    return {
      allowed: false,
      reason: "The tournament has already started"
    };
  }

  // Check if tournament is full
  if (
    tournament.maxParticipants !== undefined &&
    tournament.currentParticipants !== undefined &&
    tournament.currentParticipants >= tournament.maxParticipants
  ) {
    return {
      allowed: false,
      reason: "The tournament is full"
    };
  }

  return {
    allowed: true
  };
} 