// src/components/fantasy-pickleball/TeamCreation.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function PickleballTeamCreation() {
  const [teamName, setTeamName] = useState("");
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [remainingBudget, setRemainingBudget] = useState(1000);
  const router = useRouter();

  useEffect(() => {
    // Fetch available players for the current league
    const fetchPlayers = async () => {
      const response = await fetch("/api/fantasy-pickleball/players");
      const players = await response.json();
      setAvailablePlayers(players);
    };
    fetchPlayers();
  }, []);

  const handlePlayerSelect = (playerId: string) => {
    // Logic for player selection
    // Check budget, team composition rules
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/fantasy-pickleball/create-team", {
        method: "POST",
        body: JSON.stringify({
          teamName,
          selectedPlayers,
          leagueId: currentLeagueId, // From context or prop
        }),
      });

      if (response.ok) {
        router.push("/fantasy-pickleball/my-team");
      }
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <h1>Create Your Pickleball Fantasy Team</h1>
      <form onSubmit={handleSubmit}>
        {/* Team name input */}
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team Name"
        />

        {/* Player selection grid */}
        <div>
          {availablePlayers.map((player) => (
            <div key={player.id}>{/* Player card with selection logic */}</div>
          ))}
        </div>

        <button type="submit">Create Team</button>
      </form>
    </div>
  );
}
