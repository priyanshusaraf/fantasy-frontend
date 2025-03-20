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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewPlayerData {
  name: string;
  skillLevel: "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C" | "D";
  country?: string;
  age?: number;
  gender: "MALE" | "FEMALE" | "OTHER";
}

interface NewPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerData: NewPlayerData;
  onPlayerDataChange: (data: NewPlayerData) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
}

export function NewPlayerDialog({
  open,
  onOpenChange,
  playerData,
  onPlayerDataChange,
  onSubmit,
  children,
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
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={playerData.age || ""}
              onChange={(e) =>
                onPlayerDataChange({ 
                  ...playerData, 
                  age: e.target.value ? parseInt(e.target.value) : undefined 
                })
              }
              placeholder="Player age"
            />
          </div>

          <div className="grid gap-2">
            <Label>Skill Level</Label>
            {children ? (
              children
            ) : (
              <Select
                value={playerData.skillLevel}
                onValueChange={(value) =>
                  onPlayerDataChange({ ...playerData, skillLevel: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Gender</Label>
            <RadioGroup
              value={playerData.gender}
              onValueChange={(value: "MALE" | "FEMALE" | "OTHER") =>
                onPlayerDataChange({ ...playerData, gender: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MALE" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FEMALE" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OTHER" id="other" />
                <Label htmlFor="other">Other</Label>
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
