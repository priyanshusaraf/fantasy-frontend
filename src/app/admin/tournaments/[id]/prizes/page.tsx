'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Trash, Plus, Save, Trophy, CheckCircle, XCircle, Edit, Loader2 } from "lucide-react";
import PrizeDisbursementTable from '@/components/admin/PrizeDisbursementTable';
import PrizeRulesEditor from '@/components/admin/PrizeRulesEditor';

export default function TournamentPrizesPage({ params }: { params: { id: string }}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const tournamentId = parseInt(params.id);
  
  const [tournament, setTournament] = useState<any>(null);
  const [contests, setContests] = useState<any[]>([]);
  const [prizeRules, setPrizeRules] = useState<any[]>([]);
  const [contestRules, setContestRules] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePrizeTab, setActivePrizeTab] = useState('rules');
  const [savingRules, setSavingRules] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
      return;
    }
    
    if (status === 'authenticated') {
      loadTournamentData();
    }
  }, [status, tournamentId]);
  
  const loadTournamentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch tournament data
      const tournamentResponse = await axios.get(`/api/tournaments/${tournamentId}`);
      setTournament(tournamentResponse.data.tournament);
      
      // Fetch contests for this tournament
      const contestsResponse = await axios.get(`/api/tournaments/${tournamentId}/contests`);
      setContests(contestsResponse.data.contests || []);
      
      // Fetch prize rules
      const rulesResponse = await axios.get(`/api/tournaments/${tournamentId}/prize-rules`);
      
      // Set tournament-level rules
      setPrizeRules(rulesResponse.data.tournamentRules || []);
      
      // Process contest-specific rules
      const contestRulesObj = {};
      if (rulesResponse.data.contests) {
        rulesResponse.data.contests.forEach((contest: any) => {
          contestRulesObj[contest.id] = contest.prizeDistributionRules || [];
        });
      }
      setContestRules(contestRulesObj);
      
    } catch (error) {
      console.error('Error loading tournament data:', error);
      setError('Failed to load tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdatePrizeRules = async (rules: any[]) => {
    setSavingRules(true);
    
    try {
      await axios.post(`/api/tournaments/${tournamentId}/prize-rules`, {
        tournamentRules: rules
      });
      
      setPrizeRules(rules);
      showSuccessMessage();
    } catch (error) {
      console.error('Error updating prize rules:', error);
      setError('Failed to update prize rules. Please try again.');
    } finally {
      setSavingRules(false);
    }
  };
  
  const handleUpdateContestRules = async (contestId: number, rules: any[]) => {
    setSavingRules(true);
    
    try {
      await axios.post(`/api/tournaments/${tournamentId}/prize-rules`, {
        contestRules: [{
          contestId,
          prizeDistributionRules: rules
        }]
      });
      
      setContestRules(prev => ({
        ...prev,
        [contestId]: rules
      }));
      
      showSuccessMessage();
    } catch (error) {
      console.error('Error updating contest prize rules:', error);
      setError('Failed to update contest prize rules. Please try again.');
    } finally {
      setSavingRules(false);
    }
  };
  
  const handleDistributePrizes = async (contestId: number) => {
    if (!confirm('Are you sure you want to distribute prizes for this contest? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await axios.post(`/api/tournaments/${tournamentId}/distribute-prizes`, {
        contestId
      });
      
      if (response.data.success) {
        alert('Prizes distributed successfully!');
        loadTournamentData(); // Refresh data
      } else {
        alert(`Failed to distribute prizes: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error distributing prizes:', error);
      alert(`Error: ${error.response?.data?.error || 'Failed to distribute prizes'}`);
    }
  };
  
  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading tournament prize management...</span>
      </div>
    );
  }
  
  if (!tournament) {
    return (
      <div className="container max-w-6xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Tournament not found or you do not have permission to manage prizes.'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <p className="text-muted-foreground">Prize Distribution Management</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Tournament
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {showSuccess && (
        <Alert variant="success" className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Prize rules updated successfully!</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activePrizeTab} onValueChange={setActivePrizeTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="rules">Prize Rules</TabsTrigger>
          <TabsTrigger value="distribution">Prize Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules">
          <div className="grid gap-6">
            {/* Tournament-wide prize rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                  Tournament Prize Rules
                </CardTitle>
                <CardDescription>
                  Default prize distribution rules applied to all contests unless overridden
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrizeRulesEditor 
                  rules={prizeRules} 
                  onChange={handleUpdatePrizeRules}
                  isSaving={savingRules}
                />
              </CardContent>
            </Card>
            
            {/* Contest-specific prize rules */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Contest-Specific Prize Rules</h3>
              
              {contests.length === 0 ? (
                <p className="text-muted-foreground">No contests found for this tournament.</p>
              ) : (
                contests.map(contest => (
                  <Card key={contest.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{contest.name}</CardTitle>
                      <CardDescription>
                        Entry Fee: ₹{parseFloat(contest.entryFee.toString()).toFixed(2)} • 
                        Prize Pool: ₹{parseFloat(contest.prizePool.toString()).toFixed(2)} •
                        Teams: {contest.currentEntries}/{contest.maxEntries}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PrizeRulesEditor 
                        rules={contestRules[contest.id] || []} 
                        onChange={(rules) => handleUpdateContestRules(contest.id, rules)}
                        isSaving={savingRules}
                        contestId={contest.id}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Prize Distribution</h3>
            
            {contests.length === 0 ? (
              <p className="text-muted-foreground">No contests found for this tournament.</p>
            ) : (
              contests.map(contest => (
                <Card key={contest.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">{contest.name}</CardTitle>
                        <CardDescription>
                          Prize Pool: ₹{parseFloat(contest.prizePool.toString()).toFixed(2)} •
                          Teams: {contest.currentEntries}
                        </CardDescription>
                      </div>
                      <Badge variant={contest.status === 'COMPLETED' ? 'success' : 'secondary'}>
                        {contest.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PrizeDisbursementTable 
                      contestId={contest.id} 
                      tournamentId={tournamentId}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end border-t pt-4">
                    <Button
                      onClick={() => handleDistributePrizes(contest.id)}
                      disabled={
                        contest.status !== 'COMPLETED' || 
                        contest.isPrizesDistributed || 
                        tournament.status !== 'COMPLETED'
                      }
                      variant={contest.isPrizesDistributed ? "outline" : "default"}
                    >
                      {contest.isPrizesDistributed ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Prizes Distributed
                        </>
                      ) : (
                        <>
                          <Trophy className="mr-2 h-4 w-4" />
                          Distribute Prizes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 