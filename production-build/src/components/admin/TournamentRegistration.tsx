import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TeamManagement, { Team } from "./TeamManagement";
import PlayerManagement, { Player } from "./PlayerManagement";
import { Info, Users, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface TournamentRegistrationProps {
  isTeamBased: boolean;
  onRegistrationDataChange: (data: {
    teams: Team[];
    players: Player[];
  }) => void;
  initialTeams?: Team[];
  initialPlayers?: Player[];
}

export default function TournamentRegistration({ 
  isTeamBased, 
  onRegistrationDataChange, 
  initialTeams = [], 
  initialPlayers = [] 
}: TournamentRegistrationProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [activeTab, setActiveTab] = useState<string>(isTeamBased ? "teams" : "players");
  const [existingPlayers, setExistingPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize teams and players when component mounts or props change significantly
  useEffect(() => {
    // Only update if the arrays are different lengths or component first mounts
    if (teams.length !== initialTeams.length || players.length !== initialPlayers.length) {
      setTeams(initialTeams);
      setPlayers(initialPlayers);
    }
  }, [initialTeams.length, initialPlayers.length]);

  // Fetch existing players from the database - only once when component mounts
  useEffect(() => {
    const fetchExistingPlayers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/players");
        
        if (!response.ok) {
          throw new Error("Failed to fetch existing players");
        }
        
        const data = await response.json();
        
        // Remove duplicates by id
        const uniquePlayers = removeDuplicatePlayers(data.players || []);
        setExistingPlayers(uniquePlayers);
      } catch (error) {
        console.error("Error fetching existing players:", error);
        toast({
          title: "Error",
          description: "Failed to load existing players. You can still create new players.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingPlayers();
  }, [toast]);

  // Remove duplicate players from an array
  const removeDuplicatePlayers = (playerArray: Player[]): Player[] => {
    const uniquePlayers = new Map<number, Player>();
    
    playerArray.forEach(player => {
      if (player.id && !uniquePlayers.has(player.id)) {
        uniquePlayers.set(player.id, player);
      }
    });
    
    return Array.from(uniquePlayers.values());
  };

  // Handle teams change with useCallback to prevent unnecessary re-renders
  const handleTeamsChange = useCallback((newTeams: Team[]) => {
    // Use functional state update to avoid closure issues
    setTeams(newTeams);
    // Use a callback to access latest players state
    onRegistrationDataChange({ teams: newTeams, players });
  }, [players, onRegistrationDataChange]);

  // Handle players change with useCallback to prevent unnecessary re-renders
  const handlePlayersChange = useCallback((newPlayers: Player[]) => {
    // Use functional state update to avoid closure issues
    setPlayers(newPlayers);
    // Use a callback to access latest teams state
    onRegistrationDataChange({ teams, players: newPlayers });
  }, [teams, onRegistrationDataChange]);

  // Update active tab when isTeamBased changes
  useEffect(() => {
    setActiveTab(isTeamBased ? "teams" : "players");
  }, [isTeamBased]);

  // Prepare available players list - don't concatenate arrays to avoid duplicates
  const availablePlayersList = React.useMemo(() => {
    // Filter out players already in the teams when showing available players
    const teamPlayerIds = new Set(teams.flatMap(team => 
      team.players.filter(p => p.id).map(p => p.id)
    ));
    
    const filteredExistingPlayers = existingPlayers.filter(player => 
      player.id && !teamPlayerIds.has(player.id)
    );
    
    return filteredExistingPlayers;
  }, [teams, existingPlayers]);

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={isTeamBased ? "teams" : "players"} 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tournament Registration</h2>
          <TabsList>
            {isTeamBased && (
              <TabsTrigger value="teams" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Teams
              </TabsTrigger>
            )}
            <TabsTrigger value="players" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Players
            </TabsTrigger>
          </TabsList>
        </div>

        {isTeamBased && (
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Setup</CardTitle>
                <CardDescription>
                  Create and manage teams for your tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    In a team-based tournament, you need to create teams first, then add players to each team.
                    You can select from existing players or create new ones in the Players tab.
                  </AlertDescription>
                </Alert>
                
                <TeamManagement 
                  teams={teams} 
                  availablePlayers={[...players, ...availablePlayersList]}
                  onTeamsChange={handleTeamsChange} 
                  key="team-management"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Player Management</CardTitle>
              <CardDescription>
                {isTeamBased 
                  ? "Add players that can be assigned to teams" 
                  : "Add players to your tournament"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTeamBased && (
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Players added here will be available to assign to teams in the Teams tab.
                    {existingPlayers.length > 0 && " You can also use existing players from our database."}
                  </AlertDescription>
                </Alert>
              )}
              
              <PlayerManagement 
                players={players} 
                onPlayersChange={handlePlayersChange}
                existingPlayers={existingPlayers} 
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 