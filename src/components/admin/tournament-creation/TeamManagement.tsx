import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, Edit, Save, Trash } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Player {
  id: number;
  name: string;
  skillLevel?: string;
  imageUrl?: string;
}

interface Team {
  id?: number;
  name: string;
  players: Player[];
}

interface TeamManagementProps {
  tournamentId: number;
  availablePlayers: Player[];
  onTeamsChange: (teams: Team[]) => void;
  existingTeams?: Team[];
}

export default function TeamManagement({ 
  tournamentId, 
  availablePlayers, 
  onTeamsChange,
  existingTeams = [] 
}: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>(existingTeams);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter players that are not already assigned to teams
  const getUnassignedPlayers = () => {
    const assignedPlayerIds = teams.flatMap(team => team.players.map(player => player.id));
    return availablePlayers.filter(player => !assignedPlayerIds.includes(player.id));
  };

  // Filter players based on search query
  const filteredPlayers = (players: Player[]) => {
    if (!searchQuery) return players;
    return players.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Create a new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // Create team in database
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeamName,
          tournamentId,
          playerIds: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      const newTeam = await response.json();
      
      // Update local state
      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);
      onTeamsChange(updatedTeams);
      setNewTeamName('');
      toast.success('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a team
  const handleDeleteTeam = async (teamId: number | undefined) => {
    if (!teamId) return;

    if (!confirm('Are you sure you want to delete this team?')) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete team from database
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      // Update local state
      const updatedTeams = teams.filter(team => team.id !== teamId);
      setTeams(updatedTeams);
      onTeamsChange(updatedTeams);
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setIsLoading(false);
    }
  };

  // Add player to team
  const handleAddPlayerToTeam = async (teamId: number | undefined, player: Player) => {
    if (!teamId) return;

    // Find the team and update it
    const teamToUpdate = teams.find(team => team.id === teamId);
    if (!teamToUpdate) return;

    setIsLoading(true);
    try {
      // Get current player IDs
      const currentPlayerIds = teamToUpdate.players.map(p => p.id);
      const updatedPlayerIds = [...currentPlayerIds, player.id];

      // Update team in database
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamToUpdate.name,
          playerIds: updatedPlayerIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      const updatedTeam = await response.json();

      // Update local state
      const updatedTeams = teams.map(team => 
        team.id === teamId ? updatedTeam : team
      );
      
      setTeams(updatedTeams);
      onTeamsChange(updatedTeams);
      toast.success(`Added ${player.name} to ${teamToUpdate.name}`);
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to add player to team');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove player from team
  const handleRemovePlayerFromTeam = async (teamId: number | undefined, playerId: number) => {
    if (!teamId) return;

    // Find the team and update it
    const teamToUpdate = teams.find(team => team.id === teamId);
    if (!teamToUpdate) return;

    setIsLoading(true);
    try {
      // Get current player IDs without the removed player
      const updatedPlayerIds = teamToUpdate.players
        .filter(p => p.id !== playerId)
        .map(p => p.id);

      // Update team in database
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamToUpdate.name,
          playerIds: updatedPlayerIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      const updatedTeam = await response.json();

      // Update local state
      const updatedTeams = teams.map(team => 
        team.id === teamId ? updatedTeam : team
      );
      
      setTeams(updatedTeams);
      onTeamsChange(updatedTeams);
      toast.success(`Removed player from ${teamToUpdate.name}`);
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to remove player from team');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize edit dialog with team data
  const openEditDialog = (team: Team) => {
    setEditingTeam({...team});
    setIsEditDialogOpen(true);
  };

  // Save team edits
  const handleSaveTeamEdit = async () => {
    if (!editingTeam || !editingTeam.id) return;
    if (!editingTeam.name.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // Update team in database
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTeam.name,
          playerIds: editingTeam.players.map(p => p.id),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      const updatedTeam = await response.json();

      // Update local state
      const updatedTeams = teams.map(team => 
        team.id === editingTeam.id ? updatedTeam : team
      );
      
      setTeams(updatedTeams);
      onTeamsChange(updatedTeams);
      setIsEditDialogOpen(false);
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Management</CardTitle>
        <CardDescription>
          Create teams and assign players for your tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="teams">
          <TabsList className="mb-4">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Available Players</TabsTrigger>
          </TabsList>
          
          {/* Teams Tab */}
          <TabsContent value="teams">
            <div className="space-y-4">
              {/* Create Team Form */}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="New Team Name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  onClick={handleCreateTeam} 
                  disabled={isLoading || !newTeamName.trim()}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </div>

              {/* Teams List */}
              {teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No teams created yet. Create your first team above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team) => (
                    <Card key={team.id || team.name} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(team)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteTeam(team.id)}
                              disabled={isLoading}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <Badge>{team.players.length} Players</Badge>
                      </CardHeader>
                      <CardContent className="p-4">
                        {team.players.length === 0 ? (
                          <div className="text-center py-2 text-sm text-gray-500">
                            No players assigned yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {team.players.map((player) => (
                              <div 
                                key={player.id} 
                                className="flex justify-between items-center p-2 bg-muted/30 rounded-md"
                              >
                                <div className="flex items-center">
                                  {player.imageUrl ? (
                                    <img 
                                      src={player.imageUrl} 
                                      alt={player.name} 
                                      className="w-8 h-8 rounded-full mr-2"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/20 mr-2" />
                                  )}
                                  <span>{player.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePlayerFromTeam(team.id, player.id)}
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Available Players Tab */}
          <TabsContent value="players">
            <div className="space-y-4">
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              
              {getUnassignedPlayers().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  All players have been assigned to teams
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Skill Level</TableHead>
                      <TableHead>Assign to Team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers(getUnassignedPlayers()).map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {player.imageUrl ? (
                              <img 
                                src={player.imageUrl} 
                                alt={player.name} 
                                className="w-8 h-8 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 mr-2" />
                            )}
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {player.skillLevel && (
                            <Badge variant="outline">{player.skillLevel}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {teams.length === 0 ? (
                            <span className="text-gray-500 text-sm">Create a team first</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {teams.map((team) => (
                                <Button
                                  key={team.id || team.name}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddPlayerToTeam(team.id, player)}
                                  disabled={isLoading}
                                >
                                  {team.name}
                                </Button>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Team Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
            </DialogHeader>
            {editingTeam && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={editingTeam.name}
                    onChange={(e) => 
                      setEditingTeam({...editingTeam, name: e.target.value})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Players</Label>
                  {editingTeam.players.length === 0 ? (
                    <div className="text-center py-2 text-sm text-gray-500">
                      No players assigned yet
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {editingTeam.players.map((player) => (
                        <div 
                          key={player.id} 
                          className="flex justify-between items-center p-2 bg-muted/30 rounded-md"
                        >
                          <span>{player.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTeam({
                                ...editingTeam,
                                players: editingTeam.players.filter(p => p.id !== player.id)
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTeamEdit} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 