// src/components/player/NewPlayerDialog.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewPlayerData {
  name: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
}

interface NewPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerData: NewPlayerData;
  onPlayerDataChange: (data: NewPlayerData) => void;
  onSubmit: () => void;
}

export function NewPlayerDialog({
  open,
  onOpenChange,
  playerData,
  onPlayerDataChange,
  onSubmit,
}: NewPlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the details of the new player to add to your tournament.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Player Name *</Label>
            <Input
              id="name"
              value={playerData.name}
              onChange={(e) =>
                onPlayerDataChange({ ...playerData, name: e.target.value })
              }
              placeholder="Enter player name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={playerData.country || ""}
              onChange={(e) =>
                onPlayerDataChange({ ...playerData, country: e.target.value })
              }
              placeholder="Country of origin"
            />
          </div>

          <div className="grid gap-2">
            <Label>Skill Level</Label>
            <RadioGroup
              value={playerData.skillLevel}
              onValueChange={(
                value: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL"
              ) => onPlayerDataChange({ ...playerData, skillLevel: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BEGINNER" id="beginner" />
                <Label htmlFor="beginner">Beginner</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INTERMEDIATE" id="intermediate" />
                <Label htmlFor="intermediate">Intermediate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ADVANCED" id="advanced" />
                <Label htmlFor="advanced">Advanced</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PROFESSIONAL" id="professional" />
                <Label htmlFor="professional">Professional</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Dominant Hand</Label>
            <RadioGroup
              value={playerData.dominantHand}
              onValueChange={(value: "LEFT" | "RIGHT" | "AMBIDEXTROUS") =>
                onPlayerDataChange({ ...playerData, dominantHand: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="RIGHT" id="right" />
                <Label htmlFor="right">Right</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LEFT" id="left" />
                <Label htmlFor="left">Left</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AMBIDEXTROUS" id="ambidextrous" />
                <Label htmlFor="ambidextrous">Ambidextrous</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
          >
            Add Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
