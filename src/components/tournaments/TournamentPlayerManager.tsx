"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, MoreVertical, UserPlus, UserMinus, CheckCircle, XCircle, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Player {
  id: number;
  name: string;
  skillLevel?: string;
  country?: string;
  dominantHand?: "LEFT" | "RIGHT";
  profileImage?: string;
  isUserOnly?: boolean;
  userId?: number;
}

interface TournamentPlayerManagerProps {
  tournamentId: string | number;
}

export default function TournamentPlayerManager({ tournamentId }: TournamentPlayerManagerProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [isNewPlayerDialogOpen, setIsNewPlayerDialogOpen] = useState(false);
  const [skillLevelFilter, setSkillLevelFilter] = useState("ALL");
  
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    skillLevel: "INTERMEDIATE",
    country: "",
    dominantHand: "RIGHT",
  });

  useEffect(() => {
    fetchPlayers();
    fetchTournamentPlayers();
  }, [tournamentId]);

  // Fetch all available players
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/players");
      
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch players",
          variant: "destructive",
        });
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

  // Fetch players already in the tournament
  const fetchTournamentPlayers = async () => {
    if (!tournamentId) return;
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`);
      
      if (response.ok) {
        const data = await response.json();
        setTournamentPlayers(data.players || []);
      } else {
        // If the endpoint doesn't exist or returns error, set empty array
        setTournamentPlayers([]);
      }
    } catch (error) {
      console.error("Error fetching tournament players:", error);
      setTournamentPlayers([]);
    }
  };

  // Add a new player to the database
  const handleAddNewPlayer = async () => {
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
      setPlayers(prev => [...prev, addedPlayer]);
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

  // Handle selection of a player
  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayers(prev => {
      // Check if player is already selected
      const isSelected = prev.some(p => p.id === player.id);
      
      if (isSelected) {
        // If selected, remove from the array
        return prev.filter(p => p.id !== player.id);
      } else {
        // If not selected, add to the array
        return [...prev, player];
      }
    });
  };

  // Filter players based on search and skill level
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (player.country && player.country.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkill = skillLevelFilter === "ALL" || player.skillLevel === skillLevelFilter;
    
    // Filter out players already in the tournament
    const notInTournament = !tournamentPlayers.some(tp => tp.id === player.id);
    
    return matchesSearch && matchesSkill && notInTournament;
  });

  // Add selected players to the tournament
  const handleAddPlayersToTournament = async () => {
    if (!tournamentId || selectedPlayers.length === 0) {
      toast({
        title: "No players selected",
        description: "Please select at least one player to add to the tournament",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Group players into regular players and user-only players
      const regularPlayers = selectedPlayers.filter(p => !p.isUserOnly);
      const userOnlyPlayers = selectedPlayers.filter(p => p.isUserOnly);

      console.log(`Adding ${regularPlayers.length} regular players and ${userOnlyPlayers.length} user-only players`);

      // Handle regular players
      if (regularPlayers.length > 0) {
        const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerIds: regularPlayers.map(p => p.id),
          }),
        });

        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          const textResponse = await response.text();
          console.error("Failed to parse response:", textResponse);
          throw new Error(`Failed to add players: ${response.statusText}`);
        }
        
        if (!response.ok) {
          console.error("Error adding regular players:", responseData);
          throw new Error(`Failed to add players: ${responseData.message || response.statusText}`);
        }
        
        console.log("Player addition response:", responseData);
        
        // Check if there were any errors in the results
        const errors = responseData.results?.filter((r: any) => r.status === "error") || [];
        if (errors.length > 0) {
          console.warn("Some players couldn't be added:", errors);
          toast({
            title: "Warning",
            description: `${errors.length} players couldn't be added. See console for details.`,
            variant: "destructive",
          });
        }
        
        // Show success message
        const addedCount = responseData.summary?.added || 0;
        if (addedCount > 0) {
          toast({
            title: "Success",
            description: `Added ${addedCount} players to the tournament.`,
          });
        }
      }

      // Handle user-only players (these need to be created as player records first)
      if (userOnlyPlayers.length > 0) {
        let successCount = 0;
        
        for (const player of userOnlyPlayers) {
          try {
            // Create a player record first
            const userId = player.userId ? Math.abs(player.userId) : undefined;
            
            const createResponse = await fetch("/api/players", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: player.name,
                userId: userId,
                skillLevel: player.skillLevel || "INTERMEDIATE",
                dominantHand: player.dominantHand || "RIGHT",
                country: player.country || "",
              }),
            });
            
            if (!createResponse.ok) {
              console.error(`Failed to create player: ${player.name}`);
              continue;
            }
            
            const newPlayer = await createResponse.json();
            
            // Now add this player to the tournament
            const addResponse = await fetch(`/api/tournaments/${tournamentId}/players`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                playerIds: [newPlayer.id],
              }),
            });
            
            if (addResponse.ok) {
              successCount++;
            }
          } catch (error) {
            console.error(`Error creating/adding player ${player.name}:`, error);
          }
        }
        
        if (successCount > 0) {
          toast({
            title: "Success",
            description: `Created and added ${successCount} new players to the tournament.`,
          });
        }
      }

      // Reset UI and refresh data
      setIsAddPlayerDialogOpen(false);
      setSelectedPlayers([]);
      
      // Refresh the lists of players
      await fetchTournamentPlayers();
      await fetchPlayers();
      
    } catch (error) {
      console.error("Error adding players to tournament:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add players to tournament",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove a player from the tournament
  const handleRemovePlayerFromTournament = async (playerId: number) => {
    if (!tournamentId) return;

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players/${playerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove player from tournament");
      }

      toast({
        title: "Success",
        description: "Player removed from tournament",
      });

      // Remove player from list
      setTournamentPlayers(prev => prev.filter(p => p.id !== playerId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove player from tournament",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Tournament Players</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsNewPlayerDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Player
          </Button>
          <Button onClick={() => setIsAddPlayerDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Players
          </Button>
        </div>
      </div>

      {/* Tournament Players List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Players</CardTitle>
          <CardDescription>
            {tournamentPlayers.length} player(s) registered for this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tournamentPlayers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournamentPlayers.map(player => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {player.profileImage ? (
                          <img 
                            src={player.profileImage} 
                            alt={player.name} 
                            className="h-8 w-8 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <span className="text-xs font-bold text-primary">
                              {player.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {player.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {player.skillLevel || "Intermediate"}
                      </Badge>
                    </TableCell>
                    <TableCell>{player.country || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemovePlayerFromTournament(player.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove from Tournament
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No players added to this tournament yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Players Dialog */}
      <Dialog open={isAddPlayerDialogOpen} onOpenChange={setIsAddPlayerDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Players to Tournament</DialogTitle>
            <DialogDescription>
              Select players to add to this tournament.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={skillLevelFilter} onValueChange={setSkillLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Skill Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setIsNewPlayerDialogOpen(true)} variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Player
            </Button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto border rounded-md mb-4">
            {filteredPlayers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Skill Level</TableHead>
                    <TableHead>Country</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map(player => (
                    <TableRow 
                      key={player.id} 
                      className="cursor-pointer"
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedPlayers.some(p => p.id === player.id)}
                          onCheckedChange={() => handleSelectPlayer(player)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {player.skillLevel || "Intermediate"}
                        </Badge>
                      </TableCell>
                      <TableCell>{player.country || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No players found. Create a new player.
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedPlayers.length} player(s) selected
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsAddPlayerDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                disabled={selectedPlayers.length === 0}
                onClick={handleAddPlayersToTournament}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Selected Players
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Player Dialog */}
      <Dialog open={isNewPlayerDialogOpen} onOpenChange={setIsNewPlayerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Enter the details for the new player.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Country
              </Label>
              <Input
                id="country"
                className="col-span-3"
                value={newPlayer.country}
                onChange={(e) => setNewPlayer(prev => ({ ...prev, country: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="skillLevel" className="text-right">
                Skill Level
              </Label>
              <Select
                value={newPlayer.skillLevel}
                onValueChange={(value) => setNewPlayer(prev => ({ ...prev, skillLevel: value }))}
              >
                <SelectTrigger id="skillLevel" className="col-span-3">
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dominantHand" className="text-right">
                Dominant Hand
              </Label>
              <Select
                value={newPlayer.dominantHand}
                onValueChange={(value) => setNewPlayer(prev => ({ ...prev, dominantHand: value }))}
              >
                <SelectTrigger id="dominantHand" className="col-span-3">
                  <SelectValue placeholder="Select dominant hand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RIGHT">Right</SelectItem>
                  <SelectItem value="LEFT">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPlayerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewPlayer}>
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 