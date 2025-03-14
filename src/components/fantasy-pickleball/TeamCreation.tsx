// src/components/fantasy-pickleball/TeamCreation.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Player } from "@prisma/client";

interface TeamCreationProps {
  contestId: number;
  maxPlayers: number;
}

interface PlayerWithSelection extends Player {
  isSelected: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

const TeamCreation: React.FC<TeamCreationProps> = ({
  contestId,
  maxPlayers,
}) => {
  const [players, setPlayers] = useState<PlayerWithSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [remainingBudget, setRemainingBudget] = useState(10000); // Default budget
  const [walletSize, setWalletSize] = useState(10000); // Default wallet size
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Fetch players for contest
  useEffect(() => {
    if (!contestId) return;

    const fetchPlayersForContest = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/fantasy-pickleball/contests/${contestId}/players`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch players");
        }

        const data = await res.json();

        // Transform players to include selection state
        const playersWithSelection = data.players.map((player: Player) => ({
          ...player,
          isSelected: false,
          isCaptain: false,
          isViceCaptain: false,
        }));

        setPlayers(playersWithSelection);

        // Set wallet size from contest data
        if (data.walletSize) {
          setWalletSize(data.walletSize);
          setRemainingBudget(data.walletSize);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlayersForContest();
  }, [contestId]);

  // Handle player selection/deselection
  const handlePlayerToggle = (playerId: number) => {
    setPlayers((prevPlayers) => {
      // Find the player
      const playerIndex = prevPlayers.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return prevPlayers;

      const player = prevPlayers[playerIndex];

      // If currently not selected
      if (!player.isSelected) {
        // Check if we already have max players
        const selectedCount = prevPlayers.filter((p) => p.isSelected).length;
        if (selectedCount >= maxPlayers) {
          setError(`You can only select ${maxPlayers} players`);
          return prevPlayers;
        }

        // Check budget
        const playerPrice = player.rank
          ? Math.max(1000 / player.rank, 500)
          : 500;
        if (remainingBudget < playerPrice) {
          setError("Not enough budget to select this player");
          return prevPlayers;
        }

        // Update remaining budget
        setRemainingBudget((prev) => prev - playerPrice);
      } else {
        // If deselecting, add back to budget
        const playerPrice = player.rank
          ? Math.max(1000 / player.rank, 500)
          : 500;
        setRemainingBudget((prev) => prev + playerPrice);

        // Also remove captain/vice-captain designation if applicable
        if (player.isCaptain || player.isViceCaptain) {
          player.isCaptain = false;
          player.isViceCaptain = false;
        }
      }

      // Toggle selection
      const newPlayers = [...prevPlayers];
      newPlayers[playerIndex] = {
        ...player,
        isSelected: !player.isSelected,
      };

      return newPlayers;
    });

    // Clear any error messages
    setError(null);
  };

  // Handle captain selection
  const handleCaptainSelect = (playerId: number) => {
    setPlayers((prevPlayers) => {
      const newPlayers = prevPlayers.map((player) => ({
        ...player,
        isCaptain: player.id === playerId ? true : false,
        isViceCaptain:
          player.isViceCaptain && player.id !== playerId ? true : false,
      }));
      return newPlayers;
    });
  };

  // Handle vice-captain selection
  const handleViceCaptainSelect = (playerId: number) => {
    setPlayers((prevPlayers) => {
      const newPlayers = prevPlayers.map((player) => ({
        ...player,
        isViceCaptain: player.id === playerId ? true : false,
        isCaptain: player.isCaptain && player.id !== playerId ? true : false,
      }));
      return newPlayers;
    });
  };

  // Calculate player price based on rank
  const getPlayerPrice = (player: Player) => {
    return player.rank ? Math.max(1000 / player.rank, 500) : 500;
  };

  // Filter players based on search
  const filteredPlayers = players.filter(
    (player) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.country &&
        player.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!teamName) {
      setError("Please enter a team name");
      return;
    }

    const selectedPlayers = players.filter((p) => p.isSelected);
    if (selectedPlayers.length !== maxPlayers) {
      setError(`You must select exactly ${maxPlayers} players`);
      return;
    }

    const captains = selectedPlayers.filter((p) => p.isCaptain);
    if (captains.length !== 1) {
      setError("You must select exactly one captain");
      return;
    }

    const viceCaptains = selectedPlayers.filter((p) => p.isViceCaptain);
    if (viceCaptains.length !== 1) {
      setError("You must select exactly one vice-captain");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/fantasy-pickleball/create-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contestId,
          name: teamName,
          players: selectedPlayers.map((player) => ({
            playerId: player.id,
            isCaptain: player.isCaptain,
            isViceCaptain: player.isViceCaptain,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create team");
      }

      const result = await response.json();

      // Redirect to the team page
      router.push(`/fantasy/teams/${result.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading players...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Your Fantasy Team</h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold">Remaining Budget:</span>
            <span className="ml-2 text-lg font-bold text-green-600">
              ₹{remainingBudget.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="font-semibold">Selected:</span>
            <span className="ml-2 font-bold">
              {players.filter((p) => p.isSelected).length}/{maxPlayers}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mb-6">
        <label
          htmlFor="teamName"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Team Name
        </label>
        <input
          type="text"
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Enter your team name"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="playerSearch"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Search Players
        </label>
        <input
          type="text"
          id="playerSearch"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Search by name or country"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredPlayers.map((player) => (
          <div
            key={player.id}
            className={`border rounded-lg overflow-hidden ${
              player.isSelected
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{player.name}</h3>
                <span className="text-green-600 font-semibold">
                  ₹{getPlayerPrice(player).toLocaleString()}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-600">
                {player.country && (
                  <div className="mb-1">Country: {player.country}</div>
                )}
                {player.rank && (
                  <div className="mb-1">Rank: #{player.rank}</div>
                )}
                {player.tournamentWins > 0 && (
                  <div className="mb-1">
                    Tournament Wins: {player.tournamentWins}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handlePlayerToggle(player.id)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    player.isSelected
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {player.isSelected ? "Remove" : "Select"}
                </button>

                {player.isSelected && (
                  <>
                    <button
                      onClick={() => handleCaptainSelect(player.id)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        player.isCaptain
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      Captain (2x)
                    </button>

                    <button
                      onClick={() => handleViceCaptainSelect(player.id)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        player.isViceCaptain
                          ? "bg-purple-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      Vice-Captain (1.5x)
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleCreateTeam}
          disabled={loading}
          className={`bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating..." : "Create Team"}
        </button>
      </div>
    </div>
  );
};

export default TeamCreation;
