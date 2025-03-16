// src/components/player/PlayerCard.tsx
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand?: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
}

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export function PlayerCard({
  player,
  isSelected,
  onSelect,
  onRemove,
  showRemoveButton = false,
}: PlayerCardProps) {
  const getSkillLevelColor = (level?: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800";
      case "PROFESSIONAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`flex items-center p-3 rounded-lg border ${
        isSelected
          ? "border-[#00a1e0] bg-[#00a1e0]/5"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={player.imageUrl} alt={player.name} />
        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{player.name}</p>
        <div className="flex items-center mt-1 space-x-2">
          {player.country && (
            <span className="text-xs text-gray-500">{player.country}</span>
          )}
          {player.skillLevel && (
            <Badge
              variant="secondary"
              className={getSkillLevelColor(player.skillLevel)}
            >
              {player.skillLevel.toLowerCase()}
            </Badge>
          )}
        </div>
      </div>

      {showRemoveButton ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-red-500"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          className={isSelected ? "bg-[#00a1e0] hover:bg-[#0072a3]" : ""}
          onClick={onSelect}
          disabled={isSelected}
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      )}
    </div>
  );
}
