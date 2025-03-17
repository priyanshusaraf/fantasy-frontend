"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle, UserPlus, Save, ArrowLeft } from "lucide-react";

// Interface for Player type
interface Player {
  id: number;
  name: string;
  country?: string;
  skillLevel?: string;
  dominantHand?: string;
}

export default function AddPlayersToTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;
  const { data: session, status } = useSession();

  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [savingPlayers, setSavingPlayers] = useState(false);

  const [newPlayer, setNewPlayer] = useState({
    name: "",
    skillLevel: "INTERMEDIATE",
    country: "",
    dominantHand: "RIGHT",
  });

  // Check if user is authorized
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "TOURNAMENT_ADMIN" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/dashboard");
      return;
    }

    // Fetch tournament details
    fetchTournamentDetails();

    // Fetch all players
    fetchPlayers();
  }, [status, session, router, tournamentId]);

  // Fetch tournament details
  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching tournament: ${response.status}`);
      }
      
      const data = await response.json();
      setTournament(data);
      
      // Also fetch tournament players
      fetchTournamentPlayers();
    } catch (error) {
      console.error("Failed to load tournament:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament details.",
        variant: "destructive",
      });
    }
  };

  // Fetch all players
  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/players");
      
      if (!response.ok) {
        throw new Error(`Error fetching players: ${response.status}`);
      }
      
      const data = await response.json();
      setPlayers(data.players || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load players:", error);
      toast({
        title: "Error",
        description: "Failed to load players.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // Fetch players already in the tournament
  const fetchTournamentPlayers = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`);
      
      if (!response.ok) {
        throw new Error(`Error fetching tournament players: ${response.status}`);
      }
      
      const data = await response.json();
      setTournamentPlayers(data.players || []);
    } catch (error) {
      console.error("Failed to load tournament players:", error);
      toast({
        title: "Warning",
        description: "Failed to load current tournament players.",
        variant: "destructive",
      });
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Toggle player selection
  const togglePlayerSelection = (player: Player) => {
    if (isPlayerSelected(player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  // Check if player is already selected
  const isPlayerSelected = (playerId: number): boolean => {
    return selectedPlayers.some(player => player.id === playerId);
  };

  // Check if player is already in tournament
  const isPlayerInTournament = (playerId: number): boolean => {
    return tournamentPlayers.some(player => player.id === playerId);
  };

  // Add a new player
  const handleAddPlayer = async () => {
    if (!newPlayer.name.trim()) {
      toast({
        title: "Error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlayer),
      });

      if (!response.ok) {
        throw new Error("Failed to add player");
      }

      const addedPlayer = await response.json();
      
      // Add to players list
      setPlayers(prev => [...prev, addedPlayer]);
      
      // Add to selected players
      setSelectedPlayers(prev => [...prev, addedPlayer]);
      
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      
      setIsNewPlayerDialogOpen(false);
      setNewPlayer({
        name: "",
        skillLevel: "INTERMEDIATE",
        country: "",
        dominantHand: "RIGHT",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    }
  };

  // Save selected players to tournament
  const handleSaveSelectedPlayers = async () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one player",
        variant: "destructive",
      });
      return;
    }

    setSavingPlayers(true);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerIds: selectedPlayers.map(player => player.id)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add players to tournament");
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `${selectedPlayers.length} players added to tournament`,
      });
      
      // Navigate back to tournament details
      router.push(`/admin/tournaments/${tournamentId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add players to tournament",
        variant: "destructive",
      });
      setSavingPlayers(false);
    }
  };

  // Filter players based on search term
  const filteredPlayers = searchTerm
    ? players.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : players;

  if (status === "loading" || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/admin/tournaments/${tournamentId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tournament
        </Button>
        <h1 className="text-3xl font-bold">
          Add Players to {tournament?.name || "Tournament"}
        </h1>
        <p className="text-muted-foreground">
          Select players to add to this tournament
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                Select players from the list below or create new ones
              </CardDescription>
            </div>
            <Dialog open={isNewPlayerDialogOpen} onOpenChange={setIsNewPlayerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Player</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new player
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Name</Label>
                    <Input 
                      className="col-span-3" 
                      value={newPlayer.name} 
                      onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Country</Label>
                    <Input 
                      className="col-span-3" 
                      value={newPlayer.country} 
                      onChange={(e) => setNewPlayer({...newPlayer, country: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Skill Level</Label>
                    <Select 
                      value={newPlayer.skillLevel} 
                      onValueChange={(value) => setNewPlayer({...newPlayer, skillLevel: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Skill Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Dominant Hand</Label>
                    <Select 
                      value={newPlayer.dominantHand} 
                      onValueChange={(value) => setNewPlayer({...newPlayer, dominantHand: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Dominant Hand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RIGHT">Right</SelectItem>
                        <SelectItem value="LEFT">Left</SelectItem>
                        <SelectItem value="AMBIDEXTROUS">Ambidextrous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddPlayer}>Add Player</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-4">
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {searchTerm ? "No players found matching your search" : "No players available"}
              </div>
            ) : (
              filteredPlayers.map(player => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-3 rounded-md ${isPlayerInTournament(player.id) ? 'bg-secondary/30' : 'hover:bg-secondary/10'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id={`player-${player.id}`}
                      checked={isPlayerSelected(player.id)}
                      onCheckedChange={() => togglePlayerSelection(player)}
                      disabled={isPlayerInTournament(player.id)}
                    />
                    <div>
                      <label 
                        htmlFor={`player-${player.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {player.name}
                      </label>
                      <div className="text-sm text-muted-foreground">
                        {player.country && `${player.country} • `}
                        {player.skillLevel}
                      </div>
                    </div>
                  </div>
                  
                  {isPlayerInTournament(player.id) && (
                    <span className="text-sm text-muted-foreground">
                      Already in tournament
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {selectedPlayers.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/admin/tournaments/${tournamentId}`)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSelectedPlayers}
              disabled={selectedPlayers.length === 0 || savingPlayers}
            >
              {savingPlayers ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Players
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 