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
    skillLevel: "INTERMEDIATE",
    country: "",
    dominantHand: "RIGHT",
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
        toast({
          title: "Error",
          description: "Failed to load existing players.",
          variant: "destructive",
        });
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
      toast({
        title: "Missing Information",
        description: "Player name is required.",
        variant: "destructive",
      });
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
        skillLevel: "INTERMEDIATE",
        country: "",
        dominantHand: "RIGHT",
      });
      setIsNewPlayerDialogOpen(false);

      toast({
        title: "Success",
        description: "Player created successfully.",
      });
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error",
        description: "Failed to create player.",
        variant: "destructive",
      });
    }
  };

  // Submit selected players to tournament
  const handleSubmit = async () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "No Players Selected",
        description: "Please select at least one player for the tournament.",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: `${selectedPlayers.length} players added to the tournament.`,
      });

      // Navigate to fantasy setup
      router.push(`/tournaments/${tournamentId}/setup-fantasy`);
    } catch (error) {
      console.error("Error adding players:", error);
      toast({
        title: "Error",
        description: "Failed to add players to the tournament.",
        variant: "destructive",
      });
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
      />
    </Card>
  );
}
