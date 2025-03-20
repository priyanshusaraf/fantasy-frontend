"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";

interface JoinTournamentButtonProps {
  tournamentId: number;
  tournamentName: string;
  registrationMode?: "OPEN" | "INVITATION" | "APPROVAL";
  onJoinRequested?: () => void;
}

export default function JoinTournamentButton({
  tournamentId,
  tournamentName,
  registrationMode = "APPROVAL",
  onJoinRequested,
}: JoinTournamentButtonProps) {
  // Just return null to hide the button completely
  return null;
} 