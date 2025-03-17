"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, UserCheck, Settings, Medal, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  skillLevel?: string;
  joinDate: string;
  profileImage?: string;
}

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  result?: string;
}

interface FantasyTeam {
  id: number;
  name: string;
  contestName: string;
  points: number;
  rank: number;
  contestStatus: string;
}

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [fantasyTeams, setFantasyTeams] = useState<FantasyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    skillLevel: "",
  });

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/user/profile");
    }
  }, [status, router]);

  // Use session data directly instead of API call
  useEffect(() => {
    const initializeUserData = () => {
      if (session?.user) {
        try {
          setLoading(true);
          
          // Create profile from session data
          const userProfile: UserProfile = {
            id: session.user.id as string,
            username: session.user.username as string || session.user.name?.split(' ')[0].toLowerCase() || "user",
            name: session.user.name as string || "User",
            email: session.user.email as string || "",
            role: session.user.role as string || "USER",
            bio: "Player profile is being set up.",
            location: "Not specified",
            skillLevel: "Not specified",
            joinDate: new Date().toISOString(),
            profileImage: session.user.image || undefined,
          };
          
          setProfile(userProfile);
          setFormData({
            name: userProfile.name,
            bio: userProfile.bio || "",
            location: userProfile.location || "",
            skillLevel: userProfile.skillLevel || "",
          });
          
          // Use empty arrays for tournaments and teams for now
          setTournaments([]);
          setFantasyTeams([]);

          setError(null);
        } catch (error) {
          console.error("Error initializing user data:", error);
          setError("Failed to initialize profile data. Please try again later.");
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user) {
      initializeUserData();
    }
  }, [session]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, send to API
    // For now, just update the local state
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        skillLevel: formData.skillLevel,
      };
    });
    
    setIsEditing(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login?redirect=/user/profile")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Failed to load profile</CardTitle>
            <CardDescription>
              We encountered an error while loading your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              API endpoints might be missing. Please contact the administrator.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>
            You're signed in, but we couldn't find your profile data. This could be due to API endpoints not being set up.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Setup Required</CardTitle>
            <CardDescription>The system needs to be configured properly</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              You are signed in as {session.user?.name || session.user?.email}, but the profile API endpoints need to be set up.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add API status alert */}
      <Alert className="mb-6 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Development Mode</AlertTitle>
        <AlertDescription>
          API endpoints for user profile data are not yet available. Profile data is created from your session.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - profile summary */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={profile.profileImage} alt={profile.name} />
                  <AvatarFallback>{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">@{profile.username}</p>
                <Badge variant="outline" className="mt-2">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase()}
                </Badge>
                
                <div className="flex flex-col gap-2 mt-4 items-center text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.skillLevel && (
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-1" />
                      <span>Skill Level: {profile.skillLevel}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="mt-4 text-sm">
                    <p>{profile.bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stats Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tournaments Played</span>
                  <span className="font-medium">{tournaments.filter(t => t.status === "COMPLETED").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upcoming Tournaments</span>
                  <span className="font-medium">{tournaments.filter(t => t.status === "UPCOMING" || t.status === "REGISTERED").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fantasy Contests</span>
                  <span className="font-medium">{fantasyTeams.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best Fantasy Rank</span>
                  <span className="font-medium">
                    {fantasyTeams.length > 0 ? 
                      Math.min(...fantasyTeams.filter(t => t.rank > 0).map(t => t.rank)) : 
                      "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="fantasyTeams">Fantasy Teams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    {isEditing ? "Edit your profile information below" : "View and manage your profile information"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input 
                          id="bio" 
                          name="bio" 
                          value={formData.bio} 
                          onChange={handleInputChange} 
                          placeholder="Tell us about yourself"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          name="location" 
                          value={formData.location} 
                          onChange={handleInputChange} 
                          placeholder="Your location"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="skillLevel">Skill Level</Label>
                        <Input 
                          id="skillLevel" 
                          name="skillLevel" 
                          value={formData.skillLevel} 
                          onChange={handleInputChange} 
                          placeholder="Your skill level (e.g. 3.5, 4.0)"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit">Save Changes</Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setFormData({
                              name: profile.name,
                              bio: profile.bio || "",
                              location: profile.location || "",
                              skillLevel: profile.skillLevel || "",
                            });
                            setIsEditing(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p>{profile.email}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                          <p>@{profile.username}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                          <p>{profile.location || "Not specified"}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Skill Level</h3>
                          <p>{profile.skillLevel || "Not specified"}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                        <p>{profile.bio || "No bio provided"}</p>
                      </div>
                      
                      <Button onClick={() => setIsEditing(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tournaments">
              <Card>
                <CardHeader>
                  <CardTitle>Your Tournaments</CardTitle>
                  <CardDescription>
                    Tournaments you have participated in or registered for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tournaments.length === 0 ? (
                    <div className="text-center py-6">
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">You haven't participated in any tournaments yet</p>
                      <Button variant="outline" onClick={() => router.push("/tournaments")}>
                        Browse Tournaments
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tournaments.map((tournament) => (
                        <div key={tournament.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{tournament.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {tournament.location} • {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={
                              tournament.status === "COMPLETED" ? "outline" :
                              tournament.status === "UPCOMING" || tournament.status === "REGISTERED" ? "secondary" : "default"
                            }>
                              {tournament.status}
                            </Badge>
                          </div>
                          {tournament.result && (
                            <div className="mt-2 flex items-center">
                              <Medal className="h-4 w-4 mr-1 text-amber-500" />
                              <span className="text-sm">{tournament.result}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fantasyTeams">
              <Card>
                <CardHeader>
                  <CardTitle>Your Fantasy Teams</CardTitle>
                  <CardDescription>
                    Teams you have created for fantasy contests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fantasyTeams.length === 0 ? (
                    <div className="text-center py-6">
                      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">You haven't created any fantasy teams yet</p>
                      <Button variant="outline" onClick={() => router.push("/fantasy/contests")}>
                        Browse Contests
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fantasyTeams.map((team) => (
                        <div key={team.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{team.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {team.contestName}
                              </p>
                            </div>
                            <Badge variant={
                              team.contestStatus === "COMPLETED" ? "outline" :
                              team.contestStatus === "ACTIVE" ? "secondary" : "default"
                            }>
                              {team.contestStatus}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center">
                              <Trophy className="h-4 w-4 mr-1 text-blue-500" />
                              <span className="text-sm">Points: {team.points}</span>
                            </div>
                            {team.rank > 0 && (
                              <div className="flex items-center">
                                <Medal className="h-4 w-4 mr-1 text-amber-500" />
                                <span className="text-sm">Rank: {team.rank}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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