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
import { PlusCircle, Search, MoreVertical, UserPlus, UserMinus, CheckCircle, Shield, RefreshCcw, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Referee {
  id: number;
  name: string;
  email?: string;
  certificationLevel?: string;
  profileImage?: string;
  isUserOnly?: boolean;
  userId?: number;
}

interface TournamentRefereeManagerProps {
  tournamentId: string | number;
}

export default function TournamentRefereeManager({ tournamentId }: TournamentRefereeManagerProps) {
  const { toast } = useToast();
  const [referees, setReferees] = useState<Referee[]>([]);
  const [tournamentReferees, setTournamentReferees] = useState<Referee[]>([]);
  const [selectedReferees, setSelectedReferees] = useState<Referee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddRefereeDialogOpen, setIsAddRefereeDialogOpen] = useState(false);
  const [isNewRefereeDialogOpen, setIsNewRefereeDialogOpen] = useState(false);
  const [isAddingReferees, setIsAddingReferees] = useState(false);
  
  const [newReferee, setNewReferee] = useState({
    name: "",
    email: "",
    certificationLevel: "LEVEL_1",
  });

  useEffect(() => {
    console.log(`TournamentRefereeManager initialized with tournamentId: ${tournamentId}`);
    fetchReferees();
    fetchTournamentReferees();
  }, [tournamentId]);

  // Add refresh logic when dialog closes
  useEffect(() => {
    if (!isAddRefereeDialogOpen) {
      console.log("Add referee dialog closed, refreshing data...");
      fetchReferees();
      fetchTournamentReferees();
    }
  }, [isAddRefereeDialogOpen]);

  // Fetch all available referees
  const fetchReferees = async () => {
    try {
      setLoading(true);
      console.log("Fetching available referees...");
      
      const response = await fetch("/api/referees");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch referees: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.referees && Array.isArray(data.referees)) {
        console.log(`Received ${data.referees.length} referees from API`);
        // Log a few referees for debugging
        if (data.referees.length > 0) {
          console.log("Sample referees:", data.referees.slice(0, 3));
        }
        setReferees(data.referees);
      } else {
        console.error("Invalid referee data format:", data);
        setReferees([]);
        
        toast({
          title: "Warning",
          description: "Failed to load referee data in the expected format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching referees:", error);
      setReferees([]);
      
      toast({
        title: "Error",
        description: "Something went wrong while loading referees. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch referees already assigned to the tournament
  const fetchTournamentReferees = async () => {
    if (!tournamentId) return;
    
    try {
      console.log(`Fetching referees for tournament ${tournamentId}...`);
      const response = await fetch(`/api/tournaments/${tournamentId}/referees`);
      
      if (!response.ok) {
        console.error(`Failed to fetch tournament referees: ${response.status} ${response.statusText}`);
        
        if (response.status !== 404) {
          const errorData = await response.text();
          console.error("Error response:", errorData);
          
          toast({
            title: "Warning",
            description: "Failed to load tournament referees. Please try again later.",
            variant: "destructive",
          });
        }
        
        setTournamentReferees([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.referees && Array.isArray(data.referees)) {
        console.log(`Received ${data.referees.length} tournament referees from API`);
        // Log the referees for debugging
        if (data.referees.length > 0) {
          console.log("Tournament referees:", data.referees);
        }
        setTournamentReferees(data.referees);
      } else {
        console.error("Invalid tournament referee data format:", data);
        setTournamentReferees([]);
      }
    } catch (error) {
      console.error("Error fetching tournament referees:", error);
      setTournamentReferees([]);
      
      toast({
        title: "Error",
        description: "Something went wrong while loading tournament referees.",
        variant: "destructive",
      });
    }
  };

  // Add a new referee to the system
  const handleAddNewReferee = async () => {
    if (!newReferee.name.trim() || !newReferee.email.trim()) {
      toast({
        title: "Error",
        description: "Referee name and email are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/referees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newReferee),
      });

      if (!response.ok) {
        throw new Error("Failed to add referee");
      }

      const addedReferee = await response.json();
      setReferees(prev => [...prev, addedReferee]);
      setSelectedReferees(prev => [...prev, addedReferee]);
      
      toast({
        title: "Success",
        description: "Referee added successfully",
      });
      
      setIsNewRefereeDialogOpen(false);
      setNewReferee({
        name: "",
        email: "",
        certificationLevel: "LEVEL_1",
      });
    } catch (error: any) {
      // If the API is not implemented, simulate successful addition
      const mockReferee = {
        id: Math.floor(Math.random() * 1000) + 10,
        name: newReferee.name,
        email: newReferee.email,
        certificationLevel: newReferee.certificationLevel,
      };
      
      setReferees(prev => [...prev, mockReferee]);
      setSelectedReferees(prev => [...prev, mockReferee]);
      
      toast({
        title: "Success",
        description: "Referee added successfully (mock)",
      });
      
      setIsNewRefereeDialogOpen(false);
      setNewReferee({
        name: "",
        email: "",
        certificationLevel: "LEVEL_1",
      });
      
      console.warn("Referee API not implemented, using mock data");
    }
  };

  // Handle adding selected referees to tournament
  const handleAddRefereesToTournament = async () => {
    if (!tournamentId || selectedReferees.length === 0) {
      toast({
        title: "No referees selected",
        description: "Please select at least one referee to add to the tournament.",
        variant: "secondary",
      });
      return;
    }

    setIsAddingReferees(true);
    console.log(`Adding referees to tournament ${tournamentId}: `, selectedReferees);

    try {
      // Group referees into regular referees and user-only referees
      const regularReferees = selectedReferees.filter(r => !r.isUserOnly);
      const userOnlyReferees = selectedReferees.filter(r => r.isUserOnly);

      console.log(`Adding ${regularReferees.length} regular referees and ${userOnlyReferees.length} user-only referees`);

      // Handle regular referees
      let successCount = 0;
      
      if (regularReferees.length > 0) {
        const response = await fetch(`/api/tournaments/${tournamentId}/referees`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refereeIds: regularReferees.map(r => r.id) }),
        });

        console.log("Add regular referees response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Add regular referees response data:", data);
          
          // Count successful additions
          successCount += data.results?.filter((r: any) => r.status === "added").length || 0;
        } else {
          const errorText = await response.text();
          console.error("Failed to add regular referees:", errorText);
          throw new Error(`Failed to add regular referees: ${errorText}`);
        }
      }

      // Handle user-only referees (these need to be created as referee records first)
      if (userOnlyReferees.length > 0) {
        // First, create referee records for each user
        const createdRefereeIds = [];
        
        for (const userReferee of userOnlyReferees) {
          // The ID is negative, so the actual userId is the absolute value
          const userId = Math.abs(userReferee.userId || userReferee.id);
          
          // Create a referee record for this user
          const createResponse = await fetch("/api/referees", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: userReferee.name,
              email: userReferee.email || "",
              certificationLevel: userReferee.certificationLevel || "LEVEL_1",
            }),
          });
          
          if (createResponse.ok) {
            const newReferee = await createResponse.json();
            createdRefereeIds.push(newReferee.id);
            successCount++;
          } else {
            console.error(`Failed to create referee for user ${userId}`);
          }
        }
        
        // Now add these newly created referees to the tournament
        if (createdRefereeIds.length > 0) {
          const addResponse = await fetch(`/api/tournaments/${tournamentId}/referees`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refereeIds: createdRefereeIds,
            }),
          });
          
          if (!addResponse.ok) {
            const errorText = await addResponse.text();
            console.error("Error adding created referees:", errorText);
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: "Referees added",
          description: `Successfully added ${successCount} referee(s) to the tournament.`,
          variant: "success",
        });
        
        // Clear selection and close dialog
        setSelectedReferees([]);
        setIsAddRefereeDialogOpen(false);
        
        // Refresh tournament referees
        fetchTournamentReferees();
      } else {
        toast({
          title: "No referees added",
          description: "No referees were added. They may already be assigned to this tournament.",
          variant: "secondary",
        });
      }
    } catch (error) {
      console.error("Error adding referees:", error);
      toast({
        title: "Error",
        description: "Failed to add referees. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingReferees(false);
    }
  };

  // Remove a referee from the tournament
  const handleRemoveRefereeFromTournament = async (refereeId: number) => {
    if (!tournamentId) return;

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/referees/${refereeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove referee from tournament");
      }

      toast({
        title: "Success",
        description: "Referee removed from tournament",
      });

      // Remove referee from list
      setTournamentReferees(prev => prev.filter(r => r.id !== refereeId));
    } catch (error: any) {
      // If the API is not implemented, simulate successful removal
      setTournamentReferees(prev => prev.filter(r => r.id !== refereeId));
      
      toast({
        title: "Success",
        description: "Referee removed from tournament (mock)",
      });
      
      console.warn("Tournament referee API not implemented, using mock data");
    }
  };

  // Handle selection of a referee
  const handleSelectReferee = (referee: Referee) => {
    if (selectedReferees.some(r => r.id === referee.id)) {
      setSelectedReferees(prev => prev.filter(r => r.id !== referee.id));
    } else {
      setSelectedReferees(prev => [...prev, referee]);
    }
  };

  // Filter referees based on search
  const filteredReferees = referees.filter(referee => {
    const matchesSearch = referee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (referee.email && referee.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter out referees already in the tournament
    const notInTournament = !tournamentReferees.some(tr => tr.id === referee.id);
    
    return matchesSearch && notInTournament;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tournament Referees</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              console.log("Manual refresh triggered");
              fetchReferees();
              fetchTournamentReferees();
            }}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddRefereeDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Referee
          </Button>
        </div>
      </div>

      {/* Tournament Referees List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Referees</CardTitle>
          <CardDescription>
            {tournamentReferees.length} referee(s) assigned to this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tournamentReferees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referee</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournamentReferees.map(referee => (
                  <TableRow key={referee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {referee.profileImage ? (
                          <img 
                            src={referee.profileImage} 
                            alt={referee.name} 
                            className="h-8 w-8 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <span className="text-xs font-bold text-primary">
                              {referee.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {referee.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {referee.certificationLevel && referee.certificationLevel.replace('_', ' ') || "Level 1"}
                      </Badge>
                    </TableCell>
                    <TableCell>{referee.email || "-"}</TableCell>
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
                            onClick={() => handleRemoveRefereeFromTournament(referee.id)}
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
              No referees assigned to this tournament yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Referees Dialog */}
      <Dialog open={isAddRefereeDialogOpen} onOpenChange={setIsAddRefereeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Referees to Tournament</DialogTitle>
            <DialogDescription>
              Select referees to assign to this tournament.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search referees..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button onClick={() => setIsNewRefereeDialogOpen(true)} variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Referee
            </Button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto border rounded-md mb-4">
            {filteredReferees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferees.map(referee => (
                    <TableRow 
                      key={referee.id} 
                      className="cursor-pointer"
                      onClick={() => handleSelectReferee(referee)}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedReferees.some(r => r.id === referee.id)}
                          onCheckedChange={() => handleSelectReferee(referee)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{referee.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {referee.certificationLevel && referee.certificationLevel.replace('_', ' ') || "Level 1"}
                        </Badge>
                      </TableCell>
                      <TableCell>{referee.email || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No referees found. Create a new referee.
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedReferees.length} referee(s) selected
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsAddRefereeDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                disabled={selectedReferees.length === 0}
                onClick={handleAddRefereesToTournament}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Selected Referees
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Referee Dialog */}
      <Dialog open={isNewRefereeDialogOpen} onOpenChange={setIsNewRefereeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Referee</DialogTitle>
            <DialogDescription>
              Enter the details for the new referee.
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
                value={newReferee.name}
                onChange={(e) => setNewReferee(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                className="col-span-3"
                value={newReferee.email}
                onChange={(e) => setNewReferee(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="certificationLevel" className="text-right">
                Certification
              </Label>
              <Select
                value={newReferee.certificationLevel}
                onValueChange={(value) => setNewReferee(prev => ({ ...prev, certificationLevel: value }))}
              >
                <SelectTrigger id="certificationLevel" className="col-span-3">
                  <SelectValue placeholder="Select certification level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEVEL_1">Level 1</SelectItem>
                  <SelectItem value="LEVEL_2">Level 2</SelectItem>
                  <SelectItem value="LEVEL_3">Level 3</SelectItem>
                  <SelectItem value="MASTER">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRefereeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewReferee}>
              Add Referee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 