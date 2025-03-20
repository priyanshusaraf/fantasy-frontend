// src/components/tournament/PlayerSelectionForm.tsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { PlayerCard } from "@/components/player/PlayerCard";
import { PlayerSearch } from "@/components/player/PlayerSearch";
import { NewPlayerDialog } from "@/components/player/NewPlayerDialog";
import { Player, NewPlayerData } from "@/types/player";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to simplify toast calls
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if (type === 'success') {
    toast(message);
  } else {
    toast.error(message);
  }
};

interface PlayerSelectionFormProps {
  tournamentId: string;
}

export function PlayerSelectionForm({
  tournamentId,
}: PlayerSelectionFormProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState<NewPlayerData>({
    name: "",
    skillLevel: "B",
    country: "",
    gender: "MALE",
  });

  // Fetch existing players from DB
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/players", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }

        const data = await response.json();
        setExistingPlayers(data.players);
      } catch (error) {
        console.error("Error fetching players:", error);
        showToast("Failed to load existing players.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Filter players based on search term
  const filteredPlayers = existingPlayers.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler for selecting a player
  const handleSelectPlayer = (player: Player) => {
    if (!selectedPlayers.some((p) => p.id === player.id)) {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  // Handler for removing a player
  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));
  };

  // Handler for creating a new player
  const handleCreatePlayer = async () => {
    if (!newPlayer.name.trim()) {
      showToast("Player name is required.", "error");
      return;
    }

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newPlayer),
      });

      if (!response.ok) {
        throw new Error("Failed to create player");
      }

      const createdPlayer = await response.json();
      setExistingPlayers([...existingPlayers, createdPlayer]);
      setSelectedPlayers([...selectedPlayers, createdPlayer]);
      setNewPlayer({
        name: "",
        skillLevel: "B",
        country: "",
        gender: "MALE",
      });
      setIsNewPlayerDialogOpen(false);

      showToast("Player created successfully.");
    } catch (error) {
      console.error("Error creating player:", error);
      showToast("Failed to create player.", "error");
    }
  };

  // Submit selected players to tournament
  const handleSubmit = async () => {
    if (selectedPlayers.length === 0) {
      showToast("Please select at least one player for the tournament.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          playerIds: selectedPlayers.map((p) => p.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add players to tournament");
      }

      showToast(`${selectedPlayers.length} players added to the tournament.`);

      // Navigate to fantasy setup
      router.push(`/tournaments/${tournamentId}/setup-fantasy`);
    } catch (error) {
      console.error("Error adding players:", error);
      showToast("Failed to add players to the tournament.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00a1e0]">
          Add Players to Tournament
        </CardTitle>
        <CardDescription>
          Select existing players or create new ones for your tournament.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="existing">
          <TabsList className="mb-4">
            <TabsTrigger value="existing" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Existing Players
            </TabsTrigger>
            <TabsTrigger value="selected" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Selected Players ({selectedPlayers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing">
            <PlayerSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddNew={() => setIsNewPlayerDialogOpen(true)}
            />

            {loading ? (
              <div className="text-center py-10">Loading players...</div>
            ) : filteredPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayers.some((p) => p.id === player.id)}
                    onSelect={() => handleSelectPlayer(player)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                {searchTerm
                  ? "No players found matching your search."
                  : "No players available."}
              </div>
            )}
          </TabsContent>

          <TabsContent value="selected">
            {selectedPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isSelected={true}
                    showRemoveButton={true}
                    onRemove={() => handleRemovePlayer(player.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No players selected yet. Go to the 'Existing Players' tab to add
                players.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button
          className="bg-[#00a1e0] hover:bg-[#0072a3]"
          onClick={handleSubmit}
          disabled={submitting || selectedPlayers.length === 0}
        >
          {submitting ? "Saving..." : "Continue to Fantasy Setup"}
        </Button>
      </CardFooter>

      <NewPlayerDialog
        open={isNewPlayerDialogOpen}
        onOpenChange={setIsNewPlayerDialogOpen}
        playerData={newPlayer}
        onPlayerDataChange={setNewPlayer}
        onSubmit={handleCreatePlayer}
      >
        <Select
          value={newPlayer.skillLevel}
          onValueChange={(value) =>
            setNewPlayer({ ...newPlayer, skillLevel: value as any })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select skill level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="A-">A-</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="B-">B-</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
          </SelectContent>
        </Select>
      </NewPlayerDialog>
    </Card>
  );
}
