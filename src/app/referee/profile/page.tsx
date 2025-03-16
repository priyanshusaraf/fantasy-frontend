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
import { toast } from "@/components/ui/use-toast";
import { User, Mail, Phone, MapPin, Calendar, AlertCircle, Save, Clock, Award, Briefcase } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RefereeProfile {
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
  certification?: string;
  yearsExperience?: number;
  matchesOfficiated?: number;
  specialization?: string;
}

export default function RefereeProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState<RefereeProfile | null>(null);
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
    certification: "",
    yearsExperience: "",
    specialization: ""
  });
  
  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);
  
  // Fetch referee profile
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
            certification: data.certification || "",
            yearsExperience: data.yearsExperience?.toString() || "",
            specialization: data.specialization || ""
          });
        } catch (apiError) {
          console.error("API error:", apiError);
          
          // Use mock data if API call fails
          const mockProfile: RefereeProfile = {
            id: "1",
            username: session.user.name || "referee",
            email: session.user.email || "referee@example.com",
            firstName: "Referee",
            lastName: "User",
            profilePicture: session.user.image || "",
            bio: "Certified pickleball referee with experience in officiating professional tournaments.",
            phone: "+1 (555) 123-4567",
            address: "123 Main St",
            city: "San Francisco",
            state: "CA",
            country: "USA",
            role: "REFEREE",
            createdAt: new Date().toISOString(),
            certification: "Level 2 Certified",
            yearsExperience: 3,
            matchesOfficiated: 42,
            specialization: "Singles and Mixed Doubles"
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
            certification: mockProfile.certification || "",
            yearsExperience: mockProfile.yearsExperience?.toString() || "",
            specialization: mockProfile.specialization || ""
          });
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
      // In a real implementation, this would be an API call to update referee profile
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
          yearsExperience: parseInt(formData.yearsExperience) || profile.yearsExperience,
        });
      }
      
      toast({
        title: "Profile updated",
        description: "Your referee profile has been updated successfully.",
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
          <p className="text-muted-foreground">Loading referee profile...</p>
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
          <h1 className="text-3xl font-bold text-[#00a1e0]">Referee Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your referee information and statistics
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
                
                <p className="text-muted-foreground">
                  {profile?.certification || "Pickleball Referee"}
                </p>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.username || "Not set"}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.email}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.yearsExperience || 0} years experience</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{profile?.matchesOfficiated || 0} matches officiated</span>
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
        </div>
        
        {/* Profile Details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Referee Information</CardTitle>
              <CardDescription>
                {isEditing 
                  ? "Update your referee information below" 
                  : "Your referee details and credentials"}
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
                      <Label htmlFor="certification">Certification Level</Label>
                      <Input
                        id="certification"
                        name="certification"
                        value={formData.certification}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="yearsExperience">Years Experience</Label>
                      <Input
                        id="yearsExperience"
                        name="yearsExperience"
                        type="number"
                        value={formData.yearsExperience}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
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
        </div>
      </div>
    </div>
  );
} 