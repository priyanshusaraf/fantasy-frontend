import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, User, Users, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Player } from "./PlayerManagement";

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface TeamManagementProps {
  availablePlayers: Player[];
  teams: Team[];
  onTeamsChange: (teams: Team[]) => void;
}

export default function TeamManagement({ availablePlayers, teams, onTeamsChange }: TeamManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Set active team ID when component mounts or when teams change
  useEffect(() => {
    // If there's no active team but teams exist, set the first one active
    if ((!activeTeamId || !teams.find(t => t.id === activeTeamId)) && teams.length > 0) {
      setActiveTeamId(teams[0].id);
    }
  }, [teams, activeTeamId]);

  // Function to create a new team - using useCallback
  const handleAddTeam = useCallback(() => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: `Team ${teams.length + 1}`,
      players: []
    };
    
    onTeamsChange([...teams, newTeam]);
    setActiveTeamId(newTeam.id);
  }, [teams, onTeamsChange]);

  // Function to remove a team - using useCallback
  const handleRemoveTeam = useCallback((teamId: string) => {
    onTeamsChange(teams.filter(team => team.id !== teamId));
    
    if (activeTeamId === teamId) {
      setActiveTeamId(teams.length > 1 ? teams[0].id : null);
    }
  }, [teams, activeTeamId, onTeamsChange]);

  // Function to update team name - using useCallback
  const handleUpdateTeamName = useCallback((teamId: string, newName: string) => {
    onTeamsChange(
      teams.map(team => 
        team.id === teamId 
          ? { ...team, name: newName } 
          : team
      )
    );
  }, [teams, onTeamsChange]);

  // Function to add a player to a team - using useCallback
  const handleAddPlayerToTeam = useCallback((teamId: string, player: Player) => {
    onTeamsChange(
      teams.map(team => {
        if (team.id === teamId) {
          // Check if player is already in this team
          const playerExists = team.players.some(p => p.id === player.id);
          if (playerExists) {
            return team;
          }
          return {
            ...team,
            players: [...team.players, {...player, teamId}]
          };
        }
        return team;
      })
    );
  }, [teams, onTeamsChange]);

  // Function to remove a player from a team - using useCallback
  const handleRemovePlayerFromTeam = useCallback((teamId: string, playerId: number) => {
    onTeamsChange(
      teams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.filter(p => p.id !== playerId)
          };
        }
        return team;
      })
    );
  }, [teams, onTeamsChange]);

  // Active team
  const activeTeam = useMemo(() => 
    teams.find(team => team.id === activeTeamId) || null
  , [teams, activeTeamId]);

  // Filter available players based on search term
  const filteredAvailablePlayers = useMemo(() => {
    if (!searchTerm.trim()) return availablePlayers;
    
    return availablePlayers.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.email && player.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availablePlayers, searchTerm]);

  // Filter active team players based on search term
  const filteredTeamPlayers = useMemo(() => {
    if (!activeTeam) return [];
    if (!searchTerm.trim()) return activeTeam.players;
    
    return activeTeam.players.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.email && player.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activeTeam, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Management</h3>
        <Button
          onClick={handleAddTeam}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Teams Created</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding teams to your tournament.
          </p>
          <Button onClick={handleAddTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Team
          </Button>
        </div>
      ) :
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team List (Left Column) */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Your Teams</h4>
            
            {teams.map(team => (
              <div 
                key={team.id} 
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  activeTeamId === team.id 
                    ? "bg-primary/10 border-primary/30" 
                    : "hover:bg-muted/30"
                }`}
                onClick={() => setActiveTeamId(team.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.players.length} {team.players.length === 1 ? "player" : "players"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTeam(team.id);
                    }}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Team Details (Middle Column) */}
          <div className="md:col-span-2">
            {activeTeam ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={activeTeam.name}
                          onChange={(e) => handleUpdateTeamName(activeTeam.id, e.target.value)}
                          className="h-8 font-semibold text-lg"
                        />
                        <Badge variant="secondary" className="ml-2">
                          {activeTeam.players.length} {activeTeam.players.length === 1 ? "player" : "players"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Manage players for this team
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="team-players">
                    <TabsList className="mb-4">
                      <TabsTrigger value="team-players">Team Players</TabsTrigger>
                      <TabsTrigger value="add-players">Add Players</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="team-players">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search team players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        
                        {activeTeam.players.length === 0 ? (
                          <div className="text-center p-6 bg-muted/20 border border-dashed rounded-md">
                            <User className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                              No players added to this team yet
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[250px]">
                            <div className="space-y-2">
                              {filteredTeamPlayers.map(player => (
                                <div 
                                  key={player.id} 
                                  className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30"
                                >
                                  <div>
                                    <p className="font-medium">{player.name}</p>
                                    {player.email && <p className="text-xs text-muted-foreground">{player.email}</p>}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleRemovePlayerFromTeam(activeTeam.id, player.id)}
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="add-players">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search available players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        
                        {availablePlayers.length === 0 ? (
                          <div className="text-center p-6 bg-muted/20 border border-dashed rounded-md">
                            <User className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                              No available players. Add players in the Players tab.
                            </p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[250px]">
                            <div className="space-y-2">
                              {filteredAvailablePlayers.map(player => (
                                <div 
                                  key={player.id} 
                                  className="flex justify-between items-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 cursor-pointer"
                                  onClick={() => handleAddPlayerToTeam(activeTeam.id, player)}
                                >
                                  <div>
                                    <p className="font-medium">{player.name}</p>
                                    {player.email && <p className="text-xs text-muted-foreground">{player.email}</p>}
                                  </div>
                                  <Plus className="h-4 w-4" />
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-md p-6">
                <p className="text-muted-foreground">Select a team to manage its players</p>
              </div>
            )}
          </div>
        </div>
      }
    </div>
  );
} 