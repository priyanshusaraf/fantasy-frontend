// src/components/player/PlayerSearch.tsx
import React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PlayerSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddNew: () => void;
}

export function PlayerSearch({
  searchTerm,
  onSearchChange,
  onAddNew,
}: PlayerSearchProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search players..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Button
        variant="default"
        className="bg-[#00a1e0] hover:bg-[#0072a3]"
        onClick={onAddNew}
      >
        <Plus className="w-4 h-4 mr-2" />
        New Player
      </Button>
    </div>
  );
}
