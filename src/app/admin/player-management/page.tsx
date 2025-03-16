"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Trash2, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  UserPlus, 
  X, 
  Check 
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Player {
  id: number;
  name: string;
  country?: string;
  skillLevel?: string;
  dominantHand?: string;
  tournamentWins?: number;
  careerWinRate?: number;
  imageUrl?: string;
}

export default function PlayerManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");
  const { data: session, status } = useSession();

  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newPlayer, setNewPlayer] = useState({
    name: "",
    skillLevel: "INTERMEDIATE",
    country: "",
    dominantHand: "RIGHT",
  });

  const [tournament, setTournament] = useState<any>(null);

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

    // Fetch tournament details if tournamentId is present
    if (tournamentId) {
      fetchTournamentDetails();
    }

    // Fetch all players
    fetchPlayers();
  }, [status, session, router, tournamentId]);

  // Fetch tournament details
  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (response.ok) {
        const tournamentData = await response.json();
        setTournament(tournamentData);
        
        // Fetch players in this tournament
        const playersResponse = await fetch(`/api/tournaments/${tournamentId}/players`);
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          setTournamentPlayers(playersData.players);
          setSelectedPlayers(playersData.players);
        }
      }
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      toast({
        title: "Error",
        description: "Failed to load tournament details",
        variant: "destructive",
      });
    }
  };

  // Fetch all players
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/players");
      
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      } else {
        throw new Error("Failed to fetch players");
      }
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.country && player.country.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    return selectedPlayers.some(p => p.id === playerId);
  };

  // Check if player is already in the tournament
  const isPlayerInTournament = (playerId: number): boolean => {
    return tournamentPlayers.some(p => p.id === playerId);
  };

  // Add new player
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
      
      // If we have a tournament ID, also add to selectedPlayers
      if (tournamentId) {
        setSelectedPlayers(prev => [...prev, addedPlayer]);
        
        // Add player to the tournament
        try {
          await fetch(`/api/tournaments/${tournamentId}/players`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ playerId: addedPlayer.id }),
          });
          
          toast({
            title: "Success",
            description: `Player added to tournament successfully`,
          });
        } catch (tournamentError) {
          console.error("Error adding player to tournament:", tournamentError);
          toast({
            title: "Warning",
            description: "Player created but not added to tournament. Try adding manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Player added successfully",
        });
      }
      
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
    if (!tournamentId) return;

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerIds: selectedPlayers.map(p => p.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tournament players");
      }

      toast({
        title: "Success",
        description: "Tournament players updated successfully",
      });

      // Refresh tournament players
      fetchTournamentDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update tournament players",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {tournamentId ? "Tournament Players" : "Player Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {tournamentId
              ? `Manage players for ${tournament?.name || 'this tournament'}`
              : "Add, edit, and manage player profiles"}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {tournamentId && (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/tournaments`)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tournaments
            </Button>
          )}
          
          <Button
            onClick={() => setIsNewPlayerDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players by name or country..."
                className="pl-9"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tournamentId ? "Add Players to Tournament" : "All Players"}
          </CardTitle>
          <CardDescription>
            {tournamentId
              ? "Select players to add to this tournament"
              : "View and manage player profiles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {tournamentId && <TableHead className="w-[50px]"></TableHead>}
                  <TableHead>Player</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Dominant Hand</TableHead>
                  <TableHead>Tournament Wins</TableHead>
                  <TableHead>Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tournamentId ? 7 : 6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      {tournamentId && (
                        <TableCell>
                          <Checkbox
                            checked={isPlayerSelected(player.id)}
                            onCheckedChange={() => togglePlayerSelection(player)}
                            disabled={isPlayerInTournament(player.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {player.imageUrl ? (
                            <img
                              src={player.imageUrl}
                              alt={player.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                              {player.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          )}
                          <span>{player.name}</span>
                          {isPlayerInTournament(player.id) && (
                            <Badge variant="outline" className="ml-2">
                              In Tournament
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{player.country || "-"}</TableCell>
                      <TableCell>{player.skillLevel || "-"}</TableCell>
                      <TableCell>{player.dominantHand || "-"}</TableCell>
                      <TableCell>{player.tournamentWins || 0}</TableCell>
                      <TableCell>
                        {player.careerWinRate
                          ? `${(player.careerWinRate * 100).toFixed(1)}%`
                          : "0%"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {tournamentId && (
          <CardFooter className="justify-between">
            <div>
              {selectedPlayers.length} players selected
              {selectedPlayers.length > 0 && !tournamentPlayers.length && (
                <span className="text-xs text-muted-foreground ml-2">
                  (None currently in tournament)
                </span>
              )}
            </div>
            <Button onClick={handleSaveSelectedPlayers} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Save Players to Tournament
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Add New Player Dialog */}
      <Dialog open={isNewPlayerDialogOpen} onOpenChange={setIsNewPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Enter the details for the new player.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newPlayer.name}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, name: e.target.value })
                }
                placeholder="Player name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={newPlayer.country}
                onChange={(e) =>
                  setNewPlayer({ ...newPlayer, country: e.target.value })
                }
                placeholder="Country"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skill">Skill Level</Label>
              <Select
                value={newPlayer.skillLevel}
                onValueChange={(value) =>
                  setNewPlayer({ ...newPlayer, skillLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hand">Dominant Hand</Label>
              <Select
                value={newPlayer.dominantHand}
                onValueChange={(value) =>
                  setNewPlayer({ ...newPlayer, dominantHand: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dominant hand" />
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
            <Button variant="outline" onClick={() => setIsNewPlayerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayer}>
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
