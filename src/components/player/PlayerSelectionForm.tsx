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
import { NewPlayerData } from "@/types/player";
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
    toast({ title: message, variant: "destructive" });
  }
};

interface PlayerSelectionFormProps {
  tournamentId: string;
}

// Define the Player interface to match PlayerCard component's expectations
interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel?: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C" | "D";
  country?: string;
  age?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

// Extended version of NewPlayerData that includes email and password for the form
interface ExtendedPlayerData extends NewPlayerData {
  email?: string;
  password?: string;
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
  const [newPlayer, setNewPlayer] = useState<ExtendedPlayerData>({
    name: "",
    skillLevel: "B",
    country: "",
    gender: "MALE",
    email: "",
    password: "",
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
        // Convert API response to our local Player type with id as number
        const players = data.players.map((player: any) => ({
          ...player,
          id: typeof player.id === 'string' ? parseInt(player.id) : player.id,
        }));
        setExistingPlayers(players);
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
      setSubmitting(true);
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newPlayer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create player");
      }

      const createdPlayerData = await response.json();
      
      // Convert the created player to match our local type
      const createdPlayer: Player = {
        ...createdPlayerData,
        id: typeof createdPlayerData.id === 'string' ? parseInt(createdPlayerData.id) : createdPlayerData.id,
      };
      
      // Add the created player to both lists
      setExistingPlayers([...existingPlayers, createdPlayer]);
      setSelectedPlayers([...selectedPlayers, createdPlayer]);
      
      // Show appropriate success message
      if (createdPlayerData.email && createdPlayerData.generatedPassword) {
        // Show password in the success message for account creation
        showToast(
          `Player created successfully. Login credentials: Email: ${createdPlayerData.email} / Password: ${createdPlayerData.generatedPassword}`,
          "success"
        );
      } else {
        showToast("Player created successfully.");
      }
      
      // Reset form
      setNewPlayer({
        name: "",
        email: "",
        password: "",
        skillLevel: "B",
        country: "",
        gender: "MALE",
      });
      setIsNewPlayerDialogOpen(false);
    } catch (error) {
      console.error("Error creating player:", error);
      showToast(error instanceof Error ? error.message : "Failed to create player.", "error");
    } finally {
      setSubmitting(false);
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
