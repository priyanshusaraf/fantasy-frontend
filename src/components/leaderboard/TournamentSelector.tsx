"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface TournamentSelectorProps {
  onTournamentChange: (tournamentId: string) => void;
}

export default function TournamentSelector({ onTournamentChange }: TournamentSelectorProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tournaments?status=ACTIVE");
        
        if (!response.ok) {
          throw new Error("Failed to fetch tournaments");
        }
        
        const data = await response.json();
        setTournaments(data.tournaments || []);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[#27D3C3]" />
        Choose a tournament to view its leaderboards
      </label>
      <Select
        onValueChange={onTournamentChange}
        disabled={loading || tournaments.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading tournaments..." : tournaments.length === 0 ? "No tournaments available" : "Select a tournament"} />
        </SelectTrigger>
        <SelectContent>
          {tournaments.map((tournament) => (
            <SelectItem key={tournament.id} value={tournament.id.toString()}>
              {tournament.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 