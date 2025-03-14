// src/lib/game-user.ts
export interface GameUserProfile {
  id?: number;
  userId: number;
  username: string;
  characterName: string;
  level: number;
  experience: number;
  class: "Warrior" | "Mage" | "Rogue" | "Healer";
  race: "Human" | "Elf" | "Dwarf" | "Halfling";
  gold: number;
  inventorySlots: number;
  lastLogin: Date;
  createdAt: Date;

  // Game-specific stats
  strength: number;
  intelligence: number;
  dexterity: number;
  constitution: number;

  // Equipment
  weapon?: string;
  armor?: string;

  // Progression
  achievements: string[];
  completedQuests: number[];
}
