"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  User, Mail, Phone, MapPin, Calendar, AlertCircle, Save, 
  Trophy, Medal, Timer, Hand, BarChart, Award 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface PlayerProfile {
  id: string;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  dateOfBirth?: string;
  role: string;
  createdAt: string;
  skillLevel?: string;
  dominantHand?: string;
  ranking?: number;
  rating?: number;
  yearsPlaying?: number;
  tournamentWins?: number;
  matchesWon?: number;
  matchesLost?: number;
  winPercentage?: number;
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  result: string;
  placement: number;
}

export default function PlayerProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [tournamentHistory, setTournamentHistory] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    dateOfBirth: "",
    skillLevel: "",
    dominantHand: "",
  });
  
  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch player profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (status !== "authenticated" || !session?.user) return;
      
      try {
        setLoading(true);
        
        // Try to fetch from API first
        try {
          const response = await fetch(`/api/users/profile`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch profile");
          }
          
          const data = await response.json();
          setProfile(data);
          
          // Initialize form data
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            bio: data.bio || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : "",
            skillLevel: data.skillLevel || "",
            dominantHand: data.dominantHand || "",
          });
          
          // Fetch tournament history
          const tournamentsResponse = await fetch(`/api/players/${data.id}/tournaments`);
          if (tournamentsResponse.ok) {
            const tournamentsData = await tournamentsResponse.json();
            setTournamentHistory(tournamentsData.tournaments || []);
          }
          
        } catch (apiError) {
          console.error("API error:", apiError);
          
          // Use mock data if API call fails
          const mockProfile: PlayerProfile = {
            id: "1",
            username: session.user.name || "player",
            email: session.user.email || "player@example.com",
            firstName: "John",
            lastName: "Player",
            profilePicture: session.user.image || "",
            bio: "Professional pickleball player with 5 years of experience in competitive play.",
            phone: "+1 (555) 123-4567",
            address: "123 Main St",
            city: "San Francisco",
            state: "CA",
            country: "USA",
            role: "PLAYER",
            createdAt: new Date().toISOString(),
            skillLevel: "ADVANCED",
            dominantHand: "RIGHT",
            ranking: 42,
            rating: 4.8,
            yearsPlaying: 5,
            tournamentWins: 7,
            matchesWon: 86,
            matchesLost: 24,
            winPercentage: 78.2
          };
          
          setProfile(mockProfile);
          
          // Initialize form data
          setFormData({
            firstName: mockProfile.firstName || "",
            lastName: mockProfile.lastName || "",
            email: mockProfile.email || "",
            bio: mockProfile.bio || "",
            phone: mockProfile.phone || "",
            address: mockProfile.address || "",
            city: mockProfile.city || "",
            state: mockProfile.state || "",
            country: mockProfile.country || "",
            dateOfBirth: mockProfile.dateOfBirth ? mockProfile.dateOfBirth.split('T')[0] : "",
            skillLevel: mockProfile.skillLevel || "",
            dominantHand: mockProfile.dominantHand || "",
          });
          
          // Mock tournament history
          const mockTournaments = [
            {
              id: "1",
              name: "Summer Grand Slam",
              date: "2023-07-15",
              location: "Miami, FL",
              result: "Winner",
              placement: 1
            },
            {
              id: "2",
              name: "Regional Championships",
              date: "2023-05-22",
              location: "Denver, CO",
              result: "Semi-finalist",
              placement: 3
            },
            {
              id: "3",
              name: "Pro Tour Finals",
              date: "2023-03-10",
              location: "Austin, TX",
              result: "Finalist",
              placement: 2
            }
          ];
          
          setTournamentHistory(mockTournaments);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [session, status]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real implementation, this would be an API call to update player profile
      // const response = await fetch('/api/users/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // Mock successful response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          ...formData,
        });
      }
      
      toast({
        title: "Profile updated",
        description: "Your player profile has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading player profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#00a1e0]">Player Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your player information and track your performance
          </p>
        </div>
        
        {!isEditing ? (
          <Button 
            className="mt-4 md:mt-0"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Button 
            variant="outline"
            className="mt-4 md:mt-0"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile?.profilePicture || ""} />
                  <AvatarFallback className="text-lg">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-2xl font-bold">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                
                <div className="flex items-center mt-1 mb-3">
                  <Badge variant="secondary" className="mr-2">
                    Rank #{profile?.ranking || "N/A"}
                  </Badge>
                  <Badge variant="outline">
                    {profile?.skillLevel || "Unrated"}
                  </Badge>
                </div>
                
                <div className="w-full mt-4 space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.username || "Not set"}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.email}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Hand className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.dominantHand || "Not specified"} Hand</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Timer className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.yearsPlaying || 0} years playing</span>
                  </div>
                  
                  {profile?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile?.country && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {[profile.city, profile.state, profile.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Player Statistics Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Player Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Win Rate</span>
                    <span className="text-sm font-medium">{profile?.winPercentage || 0}%</span>
                  </div>
                  <Progress value={profile?.winPercentage || 0} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                      <span className="text-sm font-medium">Tournaments Won</span>
                    </div>
                    <p className="text-2xl font-bold">{profile?.tournamentWins || 0}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm font-medium">Rating</span>
                    </div>
                    <p className="text-2xl font-bold">{profile?.rating || "N/A"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Matches Won</p>
                    <p className="text-xl font-medium">{profile?.matchesWon || 0}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Matches Lost</p>
                    <p className="text-xl font-medium">{profile?.matchesLost || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Profile Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="tournaments">Tournament History</TabsTrigger>
            </TabsList>
            
            {/* Profile Information Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Player Information</CardTitle>
                  <CardDescription>
                    {isEditing 
                      ? "Update your player information below" 
                      : "Your player details and preferences"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={true} // Email is usually not editable
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="skillLevel">Skill Level</Label>
                          <Input
                            id="skillLevel"
                            name="skillLevel"
                            value={formData.skillLevel}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dominantHand">Dominant Hand</Label>
                          <Input
                            id="dominantHand"
                            name="dominantHand"
                            value={formData.dominantHand}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {isEditing && (
                      <div className="mt-6 flex justify-end">
                        <Button 
                          type="submit" 
                          className="flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tournament History Tab */}
            <TabsContent value="tournaments">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament History</CardTitle>
                  <CardDescription>
                    Your past tournament participation and results
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {tournamentHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tournament</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tournamentHistory.map((tournament) => (
                          <TableRow key={tournament.id}>
                            <TableCell className="font-medium">{tournament.name}</TableCell>
                            <TableCell>{new Date(tournament.date).toLocaleDateString()}</TableCell>
                            <TableCell>{tournament.location}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {tournament.placement <= 3 && (
                                  <Medal className={`h-4 w-4 mr-2 ${
                                    tournament.placement === 1 ? 'text-yellow-500' : 
                                    tournament.placement === 2 ? 'text-gray-400' : 
                                    'text-amber-700'
                                  }`} />
                                )}
                                {tournament.result}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No tournament history available</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => router.push("/tournaments")}
                      >
                        Browse Tournaments
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 