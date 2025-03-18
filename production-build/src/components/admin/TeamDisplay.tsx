import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { User, Users, Plus, UserPlus, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export interface Player {
  id: number;
  name: string;
  skillLevel?: string;
  country?: string;
}

export interface Team {
  id: number;
  name: string;
  players: Player[];
}

interface TeamDisplayProps {
  tournamentId: number;
}

export default function TeamDisplay({ tournamentId }: TeamDisplayProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // Fetch teams for the tournament
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tournaments/${tournamentId}/teams`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }
        
        const teamsData = await response.json();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Error",
          description: "Failed to load teams for this tournament.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (tournamentId) {
      fetchTeams();
    }
  }, [tournamentId, toast, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tournament Teams</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tournament Teams</h3>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teams Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no teams set up for this tournament yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tournament Teams ({teams.length})</h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <Card key={team.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{team.name}</span>
                <span className="text-sm text-muted-foreground font-normal">
                  {team.players?.length || 0} {team.players?.length === 1 ? "player" : "players"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {team.players && team.players.length > 0 ? (
                <ul className="space-y-2">
                  {team.players.map(player => (
                    <li 
                      key={player.id} 
                      className="flex items-center p-2 bg-muted/20 rounded-md"
                    >
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.skillLevel || "Skill level not specified"}
                          {player.country ? ` • ${player.country}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <p>No players in this team</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 