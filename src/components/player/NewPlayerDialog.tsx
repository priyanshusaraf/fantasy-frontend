// src/components/player/NewPlayerDialog.tsx
import React, { useState } from "react";
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
import { Eye, EyeOff } from "lucide-react";

interface NewPlayerData {
  name: string;
  email?: string;
  password?: string;
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
  const [showPassword, setShowPassword] = useState(false);

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
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={playerData.email || ""}
              onChange={(e) =>
                onPlayerDataChange({ ...playerData, email: e.target.value })
              }
              placeholder="Enter email address"
            />
            <p className="text-xs text-muted-foreground">
              Player will use this email to access their account
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={playerData.password || ""}
                onChange={(e) =>
                  onPlayerDataChange({ ...playerData, password: e.target.value })
                }
                placeholder="Create password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 
                  <EyeOff size={18} aria-hidden="true" /> : 
                  <Eye size={18} aria-hidden="true" />
                }
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional. If not provided, a temporary password will be generated.
            </p>
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
