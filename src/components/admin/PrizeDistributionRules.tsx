import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, Info, CheckCircle, AlertCircle } from "lucide-react";
import axios from 'axios';

interface PrizeRule {
  id?: number;
  rank: number;
  percentage: number;
  minPlayers: number;
}

interface Contest {
  id: number;
  name: string;
  prizePool: number;
  entryFee: number;
  prizeDistributionRules: PrizeRule[];
}

interface PrizeDistributionRulesProps {
  tournamentId: number;
}

export default function PrizeDistributionRules({ tournamentId }: PrizeDistributionRulesProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tournament');
  
  const [tournamentRules, setTournamentRules] = useState<PrizeRule[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  
  // Templates for quick setup
  const templates = {
    top3: [
      { rank: 1, percentage: 50, minPlayers: 3 },
      { rank: 2, percentage: 30, minPlayers: 3 },
      { rank: 3, percentage: 20, minPlayers: 3 }
    ],
    top5: [
      { rank: 1, percentage: 40, minPlayers: 5 },
      { rank: 2, percentage: 25, minPlayers: 5 },
      { rank: 3, percentage: 15, minPlayers: 5 },
      { rank: 4, percentage: 10, minPlayers: 5 },
      { rank: 5, percentage: 10, minPlayers: 5 }
    ],
    top10: [
      { rank: 1, percentage: 30, minPlayers: 10 },
      { rank: 2, percentage: 20, minPlayers: 10 },
      { rank: 3, percentage: 15, minPlayers: 10 },
      { rank: 4, percentage: 10, minPlayers: 10 },
      { rank: 5, percentage: 5, minPlayers: 10 },
      { rank: 6, percentage: 5, minPlayers: 10 },
      { rank: 7, percentage: 5, minPlayers: 10 },
      { rank: 8, percentage: 5, minPlayers: 10 },
      { rank: 9, percentage: 3, minPlayers: 10 },
      { rank: 10, percentage: 2, minPlayers: 10 }
    ]
  };
  
  // Get current rules based on active tab and selected contest
  const getCurrentRules = () => {
    if (activeTab === 'tournament') {
      return tournamentRules;
    } else if (selectedContestId) {
      const contest = contests.find(c => c.id === selectedContestId);
      return contest?.prizeDistributionRules || [];
    }
    return [];
  };
  
  // Set rules based on active tab and selected contest
  const setCurrentRules = (rules: PrizeRule[]) => {
    if (activeTab === 'tournament') {
      setTournamentRules(rules);
    } else if (selectedContestId) {
      setContests(prev => 
        prev.map(contest => 
          contest.id === selectedContestId 
            ? { ...contest, prizeDistributionRules: rules } 
            : contest
        )
      );
    }
  };
  
  // Fetch prize distribution rules
  useEffect(() => {
    fetchRules();
  }, [tournamentId]);
  
  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/tournaments/${tournamentId}/prize-rules`);
      setTournamentRules(response.data.tournamentRules || []);
      setContests(response.data.contests || []);
      
      // Set default selected contest if available
      if (response.data.contests && response.data.contests.length > 0) {
        setSelectedContestId(response.data.contests[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching prize rules:', error);
      setError(error.response?.data?.error || 'Failed to load prize distribution rules');
    } finally {
      setLoading(false);
    }
  };
  
  // Save prize distribution rules
  const saveRules = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    
    const currentRules = getCurrentRules();
    
    // Validate rules
    if (currentRules.length === 0) {
      setError('At least one prize rule is required');
      setSaving(false);
      return;
    }
    
    // Calculate total percentage
    const totalPercentage = currentRules.reduce((sum, rule) => sum + rule.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Total percentage must be 100%, got ${totalPercentage}%`);
      setSaving(false);
      return;
    }
    
    try {
      const payload = {
        contestId: activeTab === 'contest' ? selectedContestId : null,
        rules: currentRules
      };
      
      await axios.post(`/api/tournaments/${tournamentId}/prize-rules`, payload);
      setSuccess('Prize distribution rules saved successfully');
      fetchRules(); // Refresh data
    } catch (error: any) {
      console.error('Error saving prize rules:', error);
      setError(error.response?.data?.error || 'Failed to save prize distribution rules');
    } finally {
      setSaving(false);
    }
  };
  
  // Add empty rule
  const addRule = () => {
    const currentRules = getCurrentRules();
    const nextRank = currentRules.length > 0 ? Math.max(...currentRules.map(r => r.rank)) + 1 : 1;
    
    const distributedPercentage = currentRules.reduce((sum, rule) => sum + rule.percentage, 0);
    const remainingPercentage = Math.max(0, 100 - distributedPercentage);
    
    setCurrentRules([
      ...currentRules, 
      { rank: nextRank, percentage: remainingPercentage, minPlayers: nextRank }
    ]);
  };
  
  // Remove rule
  const removeRule = (index: number) => {
    const currentRules = getCurrentRules();
    setCurrentRules(currentRules.filter((_, i) => i !== index));
  };
  
  // Update rule
  const updateRule = (index: number, field: keyof PrizeRule, value: number) => {
    const currentRules = getCurrentRules();
    const updatedRules = [...currentRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setCurrentRules(updatedRules);
  };
  
  // Apply template
  const applyTemplate = (template: keyof typeof templates) => {
    setCurrentRules([...templates[template]]);
  };
  
  // Calculate total percentage
  const getTotalPercentage = () => {
    const currentRules = getCurrentRules();
    return currentRules.reduce((sum, rule) => sum + rule.percentage, 0);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Prize Distribution Rules</CardTitle>
        <CardDescription>
          Configure how prize money is distributed to winners
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="tournament" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="tournament">Tournament Default</TabsTrigger>
            <TabsTrigger value="contest" disabled={contests.length === 0}>Contest Specific</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tournament">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tournament Default Rules</h3>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('top3')}>
                    Top 3 Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('top5')}>
                    Top 5 Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('top10')}>
                    Top 10 Template
                  </Button>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-md text-sm flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                <span>
                  These rules will be used as defaults for all contests that don't have specific rules.
                </span>
              </div>
              
              {renderRulesTable()}
            </div>
          </TabsContent>
          
          <TabsContent value="contest">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Select 
                  value={selectedContestId?.toString() || ''}
                  onValueChange={(value) => setSelectedContestId(parseInt(value))}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a contest" />
                  </SelectTrigger>
                  <SelectContent>
                    {contests.map((contest) => (
                      <SelectItem key={contest.id} value={contest.id.toString()}>
                        {contest.name} (₹{contest.prizePool})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('top3')}>
                    Top 3 Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyTemplate('top5')}>
                    Top 5 Template
                  </Button>
                </div>
              </div>
              
              {selectedContestId && (
                <div className="bg-slate-50 p-3 rounded-md text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-500" />
                  <span>
                    These rules will apply only to this specific contest, overriding the tournament defaults.
                  </span>
                </div>
              )}
              
              {selectedContestId && renderRulesTable()}
              
              {!selectedContestId && (
                <div className="text-center p-8 text-gray-500">
                  Select a contest to configure prize rules
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm">
          Total: <span className={getTotalPercentage() === 100 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {getTotalPercentage()}%
          </span>
        </div>
        <Button 
          onClick={saveRules} 
          disabled={saving || getTotalPercentage() !== 100}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Rules'}
        </Button>
      </CardFooter>
    </Card>
  );
  
  function renderRulesTable() {
    const currentRules = getCurrentRules();
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 font-medium text-sm p-2 border-b">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Percentage (%)</div>
          <div className="col-span-4">Min Players</div>
          <div className="col-span-2">Estimated Prize</div>
          <div className="col-span-1"></div>
        </div>
        
        {currentRules.map((rule, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <Input
                type="number"
                min="1"
                value={rule.rank}
                onChange={(e) => updateRule(index, 'rank', parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>
            <div className="col-span-4">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rule.percentage}
                onChange={(e) => updateRule(index, 'percentage', parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
            <div className="col-span-4">
              <Input
                type="number"
                min="1"
                value={rule.minPlayers}
                onChange={(e) => updateRule(index, 'minPlayers', parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>
            <div className="col-span-2 text-sm">
              {activeTab === 'contest' && selectedContestId && (
                calcPrizeAmount(rule.percentage, selectedContestId)
              )}
            </div>
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addRule}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Rule
        </Button>
      </div>
    );
  }
  
  function calcPrizeAmount(percentage: number, contestId: number) {
    const contest = contests.find(c => c.id === contestId);
    if (!contest) return "₹0";
    
    const prizePool = parseFloat(contest.prizePool.toString());
    const amount = prizePool * (percentage / 100);
    
    // Calculate amount after gateway fees
    const feePercentage = 2.36; // Default Razorpay fee
    const amountAfterFees = amount - (amount * (feePercentage / 100));
    
    return (
      <div>
        <div>₹{amount.toFixed(2)}</div>
        <div className="text-xs text-gray-500">
          ₹{amountAfterFees.toFixed(2)} after fees
        </div>
      </div>
    );
  }
} 