import { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel: string;
  price: number;
  stats?: {
    tournamentWins: number;
    careerWinRate: number;
    recentForm?: string;
  };
}

interface SelectedPlayer {
  playerId: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

interface UseFantasyTeamProps {
  availablePlayers: Player[];
  maxTeamSize: number;
  initialBudget: number;
}

interface UseFantasyTeamReturn {
  selectedPlayers: SelectedPlayer[];
  remainingBudget: number;
  teamComplete: boolean;
  teamValid: boolean;
  addPlayer: (playerId: number) => void;
  removePlayer: (playerId: number) => void;
  setCaptain: (playerId: number) => void;
  setViceCaptain: (playerId: number) => void;
  getPlayerById: (playerId: number) => Player | undefined;
  hasCaptain: boolean;
  hasViceCaptain: boolean;
}

export const useFantasyTeam = ({
  availablePlayers,
  maxTeamSize,
  initialBudget
}: UseFantasyTeamProps): UseFantasyTeamReturn => {
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [remainingBudget, setRemainingBudget] = useState(initialBudget);
  const [teamComplete, setTeamComplete] = useState(false);
  const [hasCaptain, setHasCaptain] = useState(false);
  const [hasViceCaptain, setHasViceCaptain] = useState(false);
  const [teamValid, setTeamValid] = useState(false);

  // Update team status whenever selected players change
  useEffect(() => {
    // Calculate remaining budget
    const totalPrice = selectedPlayers.reduce((sum, sp) => {
      const player = availablePlayers.find(p => p.id === sp.playerId);
      return sum + (player?.price || 0);
    }, 0);
    
    setRemainingBudget(initialBudget - totalPrice);
    
    // Check if team is complete
    const isComplete = selectedPlayers.length === maxTeamSize;
    setTeamComplete(isComplete);
    
    // Check if team has captain and vice-captain
    const captainSelected = selectedPlayers.some(p => p.isCaptain);
    const viceCaptainSelected = selectedPlayers.some(p => p.isViceCaptain);
    
    setHasCaptain(captainSelected);
    setHasViceCaptain(viceCaptainSelected);
    
    // Team is valid if it's complete and has both captain and vice-captain
    setTeamValid(isComplete && captainSelected && viceCaptainSelected);
  }, [selectedPlayers, initialBudget, availablePlayers, maxTeamSize]);

  // Add a player to the team
  const addPlayer = (playerId: number) => {
    const player = availablePlayers.find(p => p.id === playerId);
    
    if (!player) return;
    
    // Check if player is already in the team
    if (selectedPlayers.some(sp => sp.playerId === playerId)) return;
    
    // Check if adding this player would exceed the budget
    const totalPrice = selectedPlayers.reduce((sum, sp) => {
      const p = availablePlayers.find(p => p.id === sp.playerId);
      return sum + (p?.price || 0);
    }, 0);
    
    if (totalPrice + player.price > initialBudget) {
      throw new Error("Adding this player would exceed your budget");
    }
    
    // Check if team is already full
    if (selectedPlayers.length >= maxTeamSize) {
      throw new Error(`You can only select up to ${maxTeamSize} players`);
    }
    
    // Add player to selected players
    setSelectedPlayers([
      ...selectedPlayers,
      { playerId, isCaptain: false, isViceCaptain: false }
    ]);
  };

  // Remove a player from the team
  const removePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.playerId !== playerId));
  };

  // Set a player as captain
  const setCaptain = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.map(player => {
      if (player.playerId === playerId) {
        return { ...player, isCaptain: true, isViceCaptain: false };
      }
      // Remove captain role from other players
      return { ...player, isCaptain: false };
    }));
  };

  // Set a player as vice-captain
  const setViceCaptain = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.map(player => {
      if (player.playerId === playerId) {
        return { ...player, isViceCaptain: true, isCaptain: false };
      }
      // Remove vice-captain role from other players
      return { ...player, isViceCaptain: false };
    }));
  };

  // Helper to get player details by ID
  const getPlayerById = (playerId: number) => {
    return availablePlayers.find(p => p.id === playerId);
  };

  return {
    selectedPlayers,
    remainingBudget,
    teamComplete,
    teamValid,
    addPlayer,
    removePlayer,
    setCaptain,
    setViceCaptain,
    getPlayerById,
    hasCaptain,
    hasViceCaptain
  };
}; 