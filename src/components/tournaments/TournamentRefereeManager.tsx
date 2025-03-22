"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Search, MoreVertical, UserPlus, UserMinus, CheckCircle, Shield, RefreshCcw, Plus, Eye, EyeOff } from "lucide-react";
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
  const [referees, setReferees] = useState<Referee[]>([]);
  const [tournamentReferees, setTournamentReferees] = useState<Referee[]>([]);
  const [selectedReferees, setSelectedReferees] = useState<Referee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddRefereeDialogOpen, setIsAddRefereeDialogOpen] = useState(false);
  const [isNewRefereeDialogOpen, setIsNewRefereeDialogOpen] = useState(false);
  const [isAddingReferees, setIsAddingReferees] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [newReferee, setNewReferee] = useState({
    name: "",
    email: "",
    password: "",
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

  // Modify all toast calls to ensure they don't pass objects as React children
  const showToast = (title: string, description?: string, variant: "default" | "destructive" = "default") => {
    // Call toast with the title and options separately
    toast({
      title,
      description,
      variant,
    });
  };

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
        
        showToast(
          "Warning", 
          "Failed to load referee data in the expected format.", 
          "destructive"
        );
      }
    } catch (error) {
      console.error("Error fetching referees:", error);
      setReferees([]);
      
      showToast(
        "Error", 
        "Something went wrong while loading referees. Please try again later.", 
        "destructive"
      );
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
          try {
            const errorData = await response.json();
            console.error("Error response JSON:", errorData);
          } catch (e) {
            const errorText = await response.text();
            console.error("Error response text:", errorText);
          }
          
          showToast(
            "Warning",
            "Failed to load tournament referees. Please try again later.",
            "destructive"
          );
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
      
      showToast(
        "Error",
        "Something went wrong while loading tournament referees.",
        "destructive"
      );
    }
  };

  // Add a new referee to the system
  const handleAddNewReferee = async () => {
    if (!newReferee.name.trim() || !newReferee.email.trim()) {
      showToast(
        "Error",
        "Referee name and email are required",
        "destructive"
      );
      return;
    }

    try {
      console.log("Creating new referee with data:", newReferee);
      
      // We need to first find or create a user
      const createUserResponse = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newReferee.name,
          email: newReferee.email,
          password: newReferee.password || undefined, // Only send if provided
          role: "REFEREE"
        }),
      });

      let errorText = "";
      if (!createUserResponse.ok) {
        try {
          const errorData = await createUserResponse.json();
          errorText = JSON.stringify(errorData);
          console.error("Error creating user:", errorData);
        } catch (e) {
          errorText = await createUserResponse.text();
          console.error("Error response text:", errorText);
        }
        
        showToast(
          "Error",
          `Failed to create user for referee: ${errorText}`,
          "destructive"
        );
        return;
      }

      const user = await createUserResponse.json();
      console.log("Created user:", user);
      
      // Now create the referee with the user ID
      const response = await fetch("/api/referees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          certificationLevel: newReferee.certificationLevel || "LEVEL_1"
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
          console.error("Error creating referee:", errorData);
        } catch (e) {
          errorText = await response.text();
          console.error("Error response text:", errorText);
        }
        
        showToast(
          "Error",
          `Failed to add referee: ${errorText}`,
          "destructive"
        );
        return;
      }

      const addedReferee = await response.json();
      console.log("Created referee:", addedReferee);
      
      // Add user information to the referee object
      const refereeWithUserInfo = {
        ...addedReferee,
        name: user.username || newReferee.name,
        email: user.email || newReferee.email
      };
      
      setReferees(prev => [...prev, refereeWithUserInfo]);
      setSelectedReferees(prev => [...prev, refereeWithUserInfo]);
      
      // Show different toast if password was generated
      if (user.generatedPassword) {
        showToast(
          "Referee added successfully",
          `Login credentials: ${user.email} / ${user.generatedPassword}`
        );
      } else {
        showToast(
          "Success",
          "Referee added successfully"
        );
      }
      
      setIsNewRefereeDialogOpen(false);
      setNewReferee({
        name: "",
        email: "",
        password: "",
        certificationLevel: "LEVEL_1",
      });
    } catch (error: any) {
      console.error("Exception adding referee:", error);
      showToast(
        "Error",
        `Exception adding referee: ${error.message || "Unknown error"}`,
        "destructive"
      );
      
      setIsNewRefereeDialogOpen(false);
      setNewReferee({
        name: "",
        email: "",
        password: "",
        certificationLevel: "LEVEL_1",
      });
    }
  };

  // Handle adding selected referees to tournament
  const handleAddRefereesToTournament = async () => {
    if (selectedReferees.length === 0) {
      showToast(
        "No referees selected",
        "Please select at least one referee to add to the tournament",
        "destructive"
      );
      return;
    }

    setIsAddingReferees(true);

    try {
      // Split selected referees into two groups:
      // 1. Regular referees (already have referee records)
      // 2. User-only referees (need to create referee records first)
      const regularReferees = selectedReferees.filter(r => !r.isUserOnly);
      const userOnlyReferees = selectedReferees.filter(r => r.isUserOnly);

      console.log(`Adding ${regularReferees.length} regular referees and ${userOnlyReferees.length} user-only referees`);
      
      // Handle regular referees
      let successCount = 0;
      
      if (regularReferees.length > 0) {
        try {
          console.log("Regular referee IDs:", regularReferees.map(r => r.id));
          console.log("Tournament ID:", tournamentId);
          
          const response = await fetch(`/api/tournaments/${tournamentId}/referees`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store"
            },
            body: JSON.stringify({ 
              refereeIds: regularReferees.map(r => r.id)
            }),
          });

          console.log("Add regular referees response status:", response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log("Add regular referees response data:", data);
            
            // Count successful additions
            successCount += data.results?.filter((r: any) => r.status === "added" || r.status === "approved" || r.status === "already_approved").length || 0;
          } else {
            let errorText = "";
            try {
              const errorData = await response.json();
              errorText = JSON.stringify(errorData);
              console.error("Error response data:", errorData);
            } catch (e) {
              try {
                errorText = await response.text();
              } catch (textError) {
                errorText = `Status code: ${response.status}`;
              }
            }
            
            console.error("Failed to add regular referees:", errorText);
            showToast(
              "Warning",
              `Some referees couldn't be added. ${errorText}`,
              "destructive"
            );
            // Continue with user-only referees instead of throwing
          }
        } catch (error) {
          console.error("Exception adding regular referees:", error);
          showToast(
            "Error",
            "Failed to add regular referees due to a network error. Try again later.",
            "destructive"
          );
          // Continue with user-only referees
        }
      }

      // Handle user-only referees (these need to be created as referee records first)
      if (userOnlyReferees.length > 0) {
        // First, create referee records for each user
        const createdRefereeIds = [];
        
        for (const userReferee of userOnlyReferees) {
          try {
            // The ID is negative, so the actual userId is the absolute value
            const userId = Math.abs(userReferee.userId || userReferee.id);
            
            console.log(`Creating referee record for user ${userId}: ${userReferee.name}`);
            
            // Create a referee record for this user
            const createResponse = await fetch("/api/referees", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store"
              },
              body: JSON.stringify({
                userId: userId,
                name: userReferee.name,
                email: userReferee.email || "",
                certificationLevel: userReferee.certificationLevel || "LEVEL_1",
              }),
            });
            
            if (createResponse.ok) {
              const newReferee = await createResponse.json();
              console.log(`Successfully created referee record ${newReferee.id} for user ${userId}`);
              createdRefereeIds.push(newReferee.id);
              successCount++;
            } else {
              let errorText = "";
              try {
                const errorData = await createResponse.json();
                errorText = JSON.stringify(errorData);
              } catch (e) {
                try {
                  errorText = await createResponse.text();
                } catch (textError) {
                  errorText = `Status code: ${createResponse.status}`;
                }
              }
              
              console.error(`Failed to create referee for user ${userId}: ${errorText}`);
              showToast(
                "Warning",
                `Could not create referee for ${userReferee.name}. This user may already have a referee record.`,
                "destructive"
              );
            }
          } catch (userError) {
            console.error(`Exception creating referee for ${userReferee.name}:`, userError);
          }
        }
        
        // Now add these newly created referees to the tournament
        if (createdRefereeIds.length > 0) {
          try {
            console.log(`Adding ${createdRefereeIds.length} newly created referees to tournament`);
            
            const addResponse = await fetch(`/api/tournaments/${tournamentId}/referees`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache, no-store"
              },
              body: JSON.stringify({ refereeIds: createdRefereeIds }),
            });
            
            if (addResponse.ok) {
              const addData = await addResponse.json();
              console.log("Add new referees response data:", addData);
              successCount += addData.results?.filter((r: any) => r.status === "added" || r.status === "approved" || r.status === "already_approved").length || 0;
            } else {
              const errorText = await addResponse.text();
              console.error("Failed to add newly created referees to tournament:", errorText);
            }
          } catch (error) {
            console.error("Exception adding newly created referees:", error);
          }
        }
      }

      // Add a small delay to ensure backend processing completes
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh the list of tournament referees
      await fetchTournamentReferees();
      
      // Clear selection
      setSelectedReferees([]);
      
      // Show success message
      showToast(
        `${successCount} Referee${successCount !== 1 ? 's' : ''} Added`,
        `Successfully added ${successCount} referee${successCount !== 1 ? 's' : ''} to the tournament.`,
        successCount > 0 ? "default" : "destructive"
      );
      
      // Close the dialog
      setIsAddRefereeDialogOpen(false);
    } catch (error) {
      console.error("Error adding referees to tournament:", error);
      showToast(
        "Error",
        "Failed to add referees to tournament. Please try again.",
        "destructive"
      );
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

      showToast(
        "Success",
        "Referee removed from tournament"
      );

      // Remove referee from list
      setTournamentReferees(prev => prev.filter(r => r.id !== refereeId));
    } catch (error: any) {
      showToast(
        "Error",
        error.message || "Failed to remove referee from tournament",
        "destructive"
      );
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
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  value={newReferee.password}
                  onChange={(e) => setNewReferee(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password or leave empty to auto-generate"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 
                    <EyeOff size={18} aria-hidden="true" /> : 
                    <Eye size={18} aria-hidden="true" />
                  }
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </button>
              </div>
              <div className="col-span-3 col-start-2">
                <p className="text-xs text-muted-foreground">
                  If left empty, a password will be automatically generated
                </p>
              </div>
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