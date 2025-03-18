import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Filter, X } from 'lucide-react';

interface ContestFiltersProps {
  onFilterChange: (filters: ContestFilters) => void;
  totalContests: number;
  availableSkillLevels?: string[];
  availableTournaments?: string[];
}

export interface ContestFilters {
  searchTerm: string;
  entryFeeRange: [number, number];
  prizePoolRange: [number, number];
  skillLevels: string[];
  tournamentIds: string[];
  status: string[];
  sortBy: 'prize_pool_desc' | 'prize_pool_asc' | 'entry_fee_desc' | 'entry_fee_asc' | 'start_date_asc' | 'start_date_desc'; 
}

const DEFAULT_FILTERS: ContestFilters = {
  searchTerm: '',
  entryFeeRange: [0, 100],
  prizePoolRange: [0, 10000],
  skillLevels: [],
  tournamentIds: [],
  status: ['UPCOMING', 'IN_PROGRESS'],
  sortBy: 'start_date_asc',
};

export function ContestFilters({
  onFilterChange,
  totalContests,
  availableSkillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'],
  availableTournaments = []
}: ContestFiltersProps) {
  const [filters, setFilters] = useState<ContestFilters>(DEFAULT_FILTERS);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...filters,
      searchTerm: e.target.value
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFilterCount(newFilters);
  };
  
  const handleEntryFeeChange = (values: number[]) => {
    const newFilters = {
      ...filters,
      entryFeeRange: [values[0], values[1]] as [number, number]
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFilterCount(newFilters);
  };
  
  const handlePrizePoolChange = (values: number[]) => {
    const newFilters = {
      ...filters,
      prizePoolRange: [values[0], values[1]] as [number, number]
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFilterCount(newFilters);
  };
  
  const handleSkillLevelChange = (level: string) => {
    const currentSkillLevels = [...filters.skillLevels];
    
    if (currentSkillLevels.includes(level)) {
      const newSkillLevels = currentSkillLevels.filter(l => l !== level);
      const newFilters = {
        ...filters,
        skillLevels: newSkillLevels
      };
      
      setFilters(newFilters);
      onFilterChange(newFilters);
      updateActiveFilterCount(newFilters);
    } else {
      const newSkillLevels = [...currentSkillLevels, level];
      const newFilters = {
        ...filters,
        skillLevels: newSkillLevels
      };
      
      setFilters(newFilters);
      onFilterChange(newFilters);
      updateActiveFilterCount(newFilters);
    }
  };
  
  const handleStatusChange = (status: string) => {
    const currentStatus = [...filters.status];
    
    if (currentStatus.includes(status)) {
      const newStatus = currentStatus.filter(s => s !== status);
      const newFilters = {
        ...filters,
        status: newStatus
      };
      
      setFilters(newFilters);
      onFilterChange(newFilters);
      updateActiveFilterCount(newFilters);
    } else {
      const newStatus = [...currentStatus, status];
      const newFilters = {
        ...filters,
        status: newStatus
      };
      
      setFilters(newFilters);
      onFilterChange(newFilters);
      updateActiveFilterCount(newFilters);
    }
  };
  
  const handleTournamentChange = (tournamentId: string) => {
    const currentIds = [...filters.tournamentIds];
    
    if (currentIds.includes(tournamentId)) {
      const newIds = currentIds.filter(id => id !== tournamentId);
      const newFilters = {
        ...filters,
        tournamentIds: newIds
      };
      
      setFilters(newFilters);
      onFilterChange(newFilters);
      updateActiveFilterCount(newFilters);
    } else {
      const newIds = [...currentIds, tournamentId];
      const newFilters = {
        ...filters,
        tournamentIds: newIds
      };
      
      setFilters(newFilters);
      onFilterChange(newFilters);
      updateActiveFilterCount(newFilters);
    }
  };
  
  const handleSortChange = (value: string) => {
    const newFilters = {
      ...filters,
      sortBy: value as ContestFilters['sortBy']
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFilterCount(newFilters);
  };
  
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
    updateActiveFilterCount(DEFAULT_FILTERS);
  };
  
  const updateActiveFilterCount = (currentFilters: ContestFilters) => {
    let count = 0;
    
    if (currentFilters.searchTerm) count++;
    if (currentFilters.entryFeeRange[0] > DEFAULT_FILTERS.entryFeeRange[0] || 
        currentFilters.entryFeeRange[1] < DEFAULT_FILTERS.entryFeeRange[1]) count++;
    if (currentFilters.prizePoolRange[0] > DEFAULT_FILTERS.prizePoolRange[0] || 
        currentFilters.prizePoolRange[1] < DEFAULT_FILTERS.prizePoolRange[1]) count++;
    if (currentFilters.skillLevels.length > 0) count++;
    if (currentFilters.tournamentIds.length > 0) count++;
    if (JSON.stringify(currentFilters.status) !== JSON.stringify(DEFAULT_FILTERS.status)) count++;
    if (currentFilters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
    
    setActiveFilterCount(count);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contests..."
            className="pl-8"
            value={filters.searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9"
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          
          <Select
            value={filters.sortBy}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prize_pool_desc">Prize: High to Low</SelectItem>
              <SelectItem value="prize_pool_asc">Prize: Low to High</SelectItem>
              <SelectItem value="entry_fee_desc">Entry: High to Low</SelectItem>
              <SelectItem value="entry_fee_asc">Entry: Low to High</SelectItem>
              <SelectItem value="start_date_asc">Start Date: Soonest</SelectItem>
              <SelectItem value="start_date_desc">Start Date: Latest</SelectItem>
            </SelectContent>
          </Select>
          
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="gap-1.5 h-9"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {isAdvancedFiltersOpen && (
        <div className="bg-muted/30 p-4 rounded-md border mt-4">
          <Accordion type="single" collapsible defaultValue="skill">
            <AccordionItem value="skill">
              <AccordionTrigger className="text-sm font-medium">
                Skill Level
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableSkillLevels.map(level => (
                    <Badge 
                      key={level}
                      variant={filters.skillLevels.includes(level) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleSkillLevelChange(level)}
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="tournaments">
              <AccordionTrigger className="text-sm font-medium">
                Tournaments
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTournaments.length > 0 ? (
                    availableTournaments.map(tournament => (
                      <Badge 
                        key={tournament}
                        variant={filters.tournamentIds.includes(tournament) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleTournamentChange(tournament)}
                      >
                        {tournament}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tournaments available</span>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="status">
              <AccordionTrigger className="text-sm font-medium">
                Contest Status
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['UPCOMING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                    <Badge 
                      key={status}
                      variant={filters.status.includes(status) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleStatusChange(status)}
                    >
                      {status.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="entry">
              <AccordionTrigger className="text-sm font-medium">
                Entry Fee
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-1">
                  <div className="flex justify-between text-sm">
                    <span>${filters.entryFeeRange[0]}</span>
                    <span>${filters.entryFeeRange[1]}</span>
                  </div>
                  <Slider
                    value={[filters.entryFeeRange[0], filters.entryFeeRange[1]]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value: number[]) => handleEntryFeeChange(value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="prize">
              <AccordionTrigger className="text-sm font-medium">
                Prize Pool
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-1">
                  <div className="flex justify-between text-sm">
                    <span>${filters.prizePoolRange[0]}</span>
                    <span>${filters.prizePoolRange[1]}</span>
                  </div>
                  <Slider
                    value={[filters.prizePoolRange[0], filters.prizePoolRange[1]]}
                    min={0}
                    max={10000}
                    step={100}
                    onValueChange={(value: number[]) => handlePrizePoolChange(value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {totalContests} contests
          {activeFilterCount > 0 && " (filtered)"}
        </div>
      </div>
    </div>
  );
} 