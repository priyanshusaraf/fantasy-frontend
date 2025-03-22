import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash, UserPlus, SearchIcon, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";

export interface Player {
  id?: number;
  name: string;
  email?: string;
  password?: string;
  phone?: string;
  skillLevel?: string;
  status?: string;
  country?: string;
  gender?: string;
  imageUrl?: string;
  isActive?: boolean;
}

interface PlayerManagementProps {
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  existingPlayers?: Player[];
  isLoading?: boolean;
}

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

export default function PlayerManagement({ 
  players, 
  onPlayersChange, 
  existingPlayers = [], 
  isLoading = false 
}: PlayerManagementProps) {
  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({
    name: '',
    email: '',
    password: '',
    phone: '',
    skillLevel: 'B',
    country: '',
    gender: 'MALE',
    status: 'ACTIVE'
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("add-new");

  const handleAddPlayer = async () => {
    if (!newPlayer.name) {
      toast.error('Player name is required');
      return;
    }
    
    if (!newPlayer.password && newPlayer.email) {
      toast.error('Password is required when email is provided');
      return;
    }

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newPlayer.name,
          email: newPlayer.email,
          password: newPlayer.password,
          phone: newPlayer.phone,
          skillLevel: newPlayer.skillLevel,
          country: newPlayer.country,
          gender: newPlayer.gender
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add player');
      }

      const createdPlayer = await response.json();
      
      // If a password was generated automatically, show it in a toast
      if (createdPlayer.generatedPassword) {
        toast.success(
          <div>
            <p>Player created successfully!</p>
            <p className="mt-2 font-bold">Login credentials:</p>
            <p>Email: {createdPlayer.email}</p>
            <p>Password: {createdPlayer.generatedPassword}</p>
          </div>,
          { duration: 10000 } // Keep it visible longer
        );
      } else {
        toast.success('Player added successfully');
      }

      // Reset form
      setNewPlayer({
        name: '',
        email: '',
        password: '',
        phone: '',
        skillLevel: 'B',
        country: '',
        gender: 'MALE',
        status: 'ACTIVE'
      });

      // Update players list
      if (onPlayersChange) {
        const newPlayerWithId = { 
          ...createdPlayer, 
          id: typeof createdPlayer.id === 'string' ? parseInt(createdPlayer.id, 10) : createdPlayer.id || Date.now() 
        };
        onPlayersChange([...players, newPlayerWithId]);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add player');
    }
  };

  // Handle adding an existing player with useCallback
  const handleAddExistingPlayer = useCallback((player: Player) => {
    // Check if player is already in the list
    if (players.some(p => p.id === player.id)) {
      return;
    }
    
    onPlayersChange([...players, player]);
  }, [players, onPlayersChange]);

  // Handle removing a player with useCallback
  const handleRemovePlayer = useCallback((playerId: number) => {
    onPlayersChange(players.filter(player => player.id !== playerId));
  }, [players, onPlayersChange]);

  // Filter existing players based on search term - with useMemo
  const filteredExistingPlayers = useMemo(() => {
    return existingPlayers.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.country && player.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (player.skillLevel && player.skillLevel.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [existingPlayers, searchTerm]);

  // Track which existing players are already in the players list - with useMemo
  const playerIdsInList = useMemo(() => {
    return new Set(players.map(player => player.id));
  }, [players]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Player Management</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Player Creation and Selection Tabs */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Add Players</CardTitle>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="add-new">Create New</TabsTrigger>
                <TabsTrigger value="existing">Use Existing</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Create New Player Form */}
            {activeTab === "add-new" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Player Name *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="playerName"
                      placeholder="Enter player name"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                    />
                    <Button 
                      onClick={handleAddPlayer}
                      disabled={!newPlayer.name}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerEmail">Email (Optional)</Label>
                  <Input
                    id="playerEmail"
                    type="email"
                    placeholder="Enter email address"
                    value={newPlayer.email || ""}
                    onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerPassword">Password</Label>
                  <Input
                    id="playerPassword"
                    type="password"
                    placeholder="Enter password"
                    value={newPlayer.password || ""}
                    onChange={(e) => setNewPlayer({...newPlayer, password: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    If not provided, a random password will be generated.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerPhone">Phone (Optional)</Label>
                  <Input
                    id="playerPhone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={newPlayer.phone || ""}
                    onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerSkill">Skill Level (Optional)</Label>
                  <Select
                    value={newPlayer.skillLevel || ""}
                    onValueChange={(value) => setNewPlayer({...newPlayer, skillLevel: value})}
                  >
                    <SelectTrigger id="playerSkill">
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map(level => (
                        <SelectItem key={level.toLowerCase()} value={level.toLowerCase()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="playerCountry">Country (Optional)</Label>
                  <Input
                    id="playerCountry"
                    placeholder="Enter country"
                    value={newPlayer.country || ""}
                    onChange={(e) => setNewPlayer({...newPlayer, country: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {/* Use Existing Players */}
            {activeTab === "existing" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerSearch">Search Players</Label>
                  <Input
                    id="playerSearch"
                    placeholder="Search by name or country"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <ScrollArea className="h-56 border rounded-md">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-sm text-muted-foreground">Loading players...</p>
                    </div>
                  ) : filteredExistingPlayers.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-sm text-muted-foreground p-4 text-center">
                        {searchTerm 
                          ? "No players match your search." 
                          : "No existing players found."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredExistingPlayers.map(player => (
                        <div 
                          key={player.id} 
                          className="p-2 hover:bg-muted/30 cursor-pointer flex justify-between items-center"
                          onClick={() => !playerIdsInList.has(player.id) && handleAddExistingPlayer(player)}
                        >
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {player.skillLevel && <span>{player.skillLevel}</span>}
                              {player.country && <span> • {player.country}</span>}
                            </div>
                          </div>
                          
                          {playerIdsInList.has(player.id) ? (
                            <div className="text-xs text-muted-foreground">Already Added</div>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Player List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Selected Players</CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg">
                <UserPlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Players Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Add players from the left panel to include them in your tournament.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.map(player => (
                  <div 
                    key={player.id} 
                    className="flex justify-between items-center p-3 bg-muted/20 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <div className="flex text-xs text-muted-foreground gap-2">
                        {player.email && <span>{player.email}</span>}
                        {player.skillLevel && <span>• {player.skillLevel}</span>}
                        {player.country && <span>• {player.country}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 