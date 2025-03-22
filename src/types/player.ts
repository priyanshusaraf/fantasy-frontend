// src/types/player.ts
export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  skillLevel?: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C' | 'D';
  country?: string;
  age?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

export interface NewPlayerData {
  name: string;
  skillLevel: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C" | "D";
  country?: string;
  age?: number;
  gender: "MALE" | "FEMALE" | "OTHER";
}
