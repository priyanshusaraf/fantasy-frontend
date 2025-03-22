// Update skill level options to match the database format
export const SKILL_LEVELS = [
  { value: "A+", label: "A+" },
  { value: "A", label: "A" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B", label: "B" },
  { value: "B-", label: "B-" },
  { value: "C", label: "C" },
  { value: "D", label: "D" }
] as const;

export type SkillLevel = typeof SKILL_LEVELS[number]['value']; 