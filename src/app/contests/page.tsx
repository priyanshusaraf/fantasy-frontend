"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { ContestFilters, ContestFilters as ContestFiltersType } from "@/components/fantasy-pickleball/ContestFilters";
import { Users, Trophy, Calendar, TrendingUp, Clock, Loader2 } from "lucide-react";

// Placeholder interface for contest data
interface Contest {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  tournamentId: string;
  tournamentName: string;
  skillLevel: string;
  isGuaranteed: boolean;
}

export default function ContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<string[]>([]);
  
  // Fetch contests on page load
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/contests');
        if (!response.ok) throw new Error('Failed to fetch contests');
        const data = await response.json();
        
        setContests(data);
        setFilteredContests(data);
        
        // Extract unique tournament names and skill levels for filters
        const uniqueTournaments = Array.from(new Set(data.map((c: Contest) => c.tournamentName)));
        const uniqueSkillLevels = Array.from(new Set(data.map((c: Contest) => c.skillLevel)));
        
        setTournaments(uniqueTournaments as string[]);
        setSkillLevels(uniqueSkillLevels as string[]);
        
      } catch (error) {
        console.error('Error fetching contests:', error);
        setError('Failed to load contests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContests();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (filters: ContestFiltersType) => {
    let filtered = [...contests];
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(contest => 
        contest.name.toLowerCase().includes(searchTerm) || 
        contest.description.toLowerCase().includes(searchTerm) ||
        contest.tournamentName.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply entry fee filter
    filtered = filtered.filter(contest => 
      contest.entryFee >= filters.entryFeeRange[0] && 
      contest.entryFee <= filters.entryFeeRange[1]
    );
    
    // Apply prize pool filter
    filtered = filtered.filter(contest => 
      contest.prizePool >= filters.prizePoolRange[0] && 
      contest.prizePool <= filters.prizePoolRange[1]
    );
    
    // Apply skill level filter
    if (filters.skillLevels.length > 0) {
      filtered = filtered.filter(contest => 
        filters.skillLevels.includes(contest.skillLevel)
      );
    }
    
    // Apply tournament filter
    if (filters.tournamentIds.length > 0) {
      filtered = filtered.filter(contest => 
        filters.tournamentIds.includes(contest.tournamentName)
      );
    }
    
    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(contest => 
        filters.status.includes(contest.status)
      );
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'prize_pool_desc':
        filtered.sort((a, b) => b.prizePool - a.prizePool);
        break;
      case 'prize_pool_asc':
        filtered.sort((a, b) => a.prizePool - b.prizePool);
        break;
      case 'entry_fee_desc':
        filtered.sort((a, b) => b.entryFee - a.entryFee);
        break;
      case 'entry_fee_asc':
        filtered.sort((a, b) => a.entryFee - b.entryFee);
        break;
      case 'start_date_asc':
        filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case 'start_date_desc':
        filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
    }
    
    setFilteredContests(filtered);
  };
  
  // Get appropriate badge color for contest status
  const getStatusBadgeVariant = (status: Contest['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Calculate fill percentage for contest
  const calculateFillPercentage = (current: number, max: number) => {
    return Math.min(100, Math.round((current / max) * 100));
  };
  
  // Navigate to contest detail
  const handleViewContest = (contestId: string) => {
    router.push(`/contests/${contestId}`);
  };
  
  // Navigate to create team
  const handleCreateTeam = (contestId: string) => {
    router.push(`/contests/${contestId}/create-team`);
  };
  
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading contests...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fantasy Contests</h1>
          <p className="text-muted-foreground mt-1">
            Browse and join fantasy pickleball contests
          </p>
        </div>
      </div>
      
      <ContestFilters 
        onFilterChange={handleFilterChange}
        totalContests={filteredContests.length}
        availableSkillLevels={skillLevels}
        availableTournaments={tournaments}
      />
      
      <Separator className="my-8" />
      
      {filteredContests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">No contests match your filters</p>
          <Button variant="outline" onClick={() => handleFilterChange({
            searchTerm: '',
            entryFeeRange: [0, 100],
            prizePoolRange: [0, 10000],
            skillLevels: [],
            tournamentIds: [],
            status: ['UPCOMING', 'IN_PROGRESS'],
            sortBy: 'start_date_asc',
          })}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContests.map((contest) => (
            <Card key={contest.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={getStatusBadgeVariant(contest.status)}>
                    {contest.status.replace('_', ' ')}
                  </Badge>
                  {contest.isGuaranteed && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Guaranteed
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2">{contest.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {contest.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 flex-grow">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Trophy className="h-5 w-5 text-primary mb-1" />
                    <span className="font-bold">${contest.prizePool.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Prize Pool</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary mb-1" />
                    <span className="font-bold">{contest.currentEntries}/{contest.maxEntries}</span>
                    <span className="text-xs text-muted-foreground">Entries</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{formatDate(contest.startDate)}</span>
                    </div>
                    <Badge variant="outline">{contest.skillLevel}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{contest.tournamentName}</span>
                    <span className="font-medium">${contest.entryFee} entry</span>
                  </div>
                  
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${calculateFillPercentage(contest.currentEntries, contest.maxEntries)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{calculateFillPercentage(contest.currentEntries, contest.maxEntries)}% full</span>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(contest.startDate) > new Date() 
                        ? `Starts in ${Math.ceil((new Date(contest.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                        : contest.status === 'IN_PROGRESS' 
                          ? `Ends in ${Math.ceil((new Date(contest.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                          : 'Contest ended'}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleViewContest(contest.id)}
                  >
                    View Details
                  </Button>
                  <Button 
                    className="flex-1"
                    disabled={contest.status !== 'UPCOMING' && contest.status !== 'IN_PROGRESS'}
                    onClick={() => handleCreateTeam(contest.id)}
                  >
                    Join Contest
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 