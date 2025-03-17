'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash, Save, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrizeRule {
  id?: number;
  rank: number;
  percentage: number;
  minPlayers: number;
}

interface PrizeRulesEditorProps {
  rules: PrizeRule[];
  onChange: (rules: PrizeRule[]) => void;
  isSaving?: boolean;
  contestId?: number;
}

export default function PrizeRulesEditor({
  rules,
  onChange,
  isSaving = false,
  contestId
}: PrizeRulesEditorProps) {
  const [localRules, setLocalRules] = useState<PrizeRule[]>([]);
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with provided rules or default rules
  useEffect(() => {
    if (rules && rules.length > 0) {
      setLocalRules(rules);
    } else {
      // Default distribution: 50% for 1st, 30% for 2nd, 20% for 3rd
      setLocalRules([
        { rank: 1, percentage: 50, minPlayers: 1 },
        { rank: 2, percentage: 30, minPlayers: 2 },
        { rank: 3, percentage: 20, minPlayers: 3 }
      ]);
    }
  }, [rules]);
  
  // Calculate total percentage whenever rules change
  useEffect(() => {
    const total = localRules.reduce((sum, rule) => sum + parseFloat(rule.percentage.toString()), 0);
    setTotalPercentage(total);
    
    // Clear error if total is 100%
    if (Math.abs(total - 100) < 0.01) {
      setError(null);
    }
  }, [localRules]);
  
  const handleRuleChange = (index: number, field: keyof PrizeRule, value: any) => {
    const updatedRules = [...localRules];
    
    if (field === 'rank') {
      // Ensure rank is a positive integer
      updatedRules[index][field] = Math.max(1, parseInt(value) || 1);
    } else if (field === 'percentage') {
      // Ensure percentage is a number between 0 and 100
      updatedRules[index][field] = Math.min(100, Math.max(0, parseFloat(value) || 0));
    } else if (field === 'minPlayers') {
      // Ensure minPlayers is a positive integer
      updatedRules[index][field] = Math.max(1, parseInt(value) || 1);
    } else {
      updatedRules[index][field] = value;
    }
    
    setLocalRules(updatedRules);
  };
  
  const addNewRule = () => {
    // Find the highest rank
    const highestRank = localRules.reduce((max, rule) => Math.max(max, rule.rank), 0);
    
    // Calculate remaining percentage
    const remainingPercentage = Math.max(0, 100 - totalPercentage);
    
    setLocalRules([
      ...localRules,
      {
        rank: highestRank + 1,
        percentage: remainingPercentage,
        minPlayers: highestRank + 1
      }
    ]);
  };
  
  const removeRule = (index: number) => {
    const updatedRules = [...localRules];
    updatedRules.splice(index, 1);
    setLocalRules(updatedRules);
  };
  
  const handleSave = () => {
    // Validate total percentage is 100%
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError('Total percentage must equal 100%');
      return;
    }
    
    // Sort rules by rank before saving
    const sortedRules = [...localRules].sort((a, b) => a.rank - b.rank);
    
    // Call the onChange handler with the updated rules
    onChange(sortedRules);
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 pb-2">
        <div className="col-span-2">Rank</div>
        <div className="col-span-4">Prize Percentage</div>
        <div className="col-span-4">Min. Players</div>
        <div className="col-span-2">Actions</div>
      </div>
      
      {/* Rule rows */}
      {localRules.map((rule, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-2">
            <Input
              type="number"
              min="1"
              value={rule.rank}
              onChange={(e) => handleRuleChange(index, 'rank', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-4 relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={rule.percentage}
              onChange={(e) => handleRuleChange(index, 'percentage', e.target.value)}
              className="w-full"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
          <div className="col-span-4">
            <Input
              type="number"
              min="1"
              value={rule.minPlayers}
              onChange={(e) => handleRuleChange(index, 'minPlayers', e.target.value)}
              className="w-full"
              title="Minimum number of players required for this prize to be awarded"
            />
          </div>
          <div className="col-span-2 flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRule(index)}
              disabled={localRules.length <= 1 || isSaving}
              className="text-red-500 hover:text-red-700"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      {/* Total percentage display */}
      <div className="flex justify-between items-center pt-2 border-t">
        <Badge variant={Math.abs(totalPercentage - 100) < 0.01 ? "outline" : "destructive"} 
               className={Math.abs(totalPercentage - 100) < 0.01 ? "bg-green-50 text-green-700 border-green-200" : ""}>
          Total: {totalPercentage.toFixed(2)}%
        </Badge>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addNewRule}
            disabled={isSaving}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Prize Position
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || Math.abs(totalPercentage - 100) > 0.01}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" /> Save Rules
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Help text */}
      <div className="text-xs text-gray-500 mt-2 flex items-start">
        <div className="mt-0.5 mr-1">
          <Info className="h-3 w-3" />
        </div>
        <p>
          Set prize distribution percentages for each rank. Total must equal 100%. The minimum players field determines 
          how many participants are needed for a prize to be awarded at this rank.
        </p>
      </div>
    </div>
  );
} 