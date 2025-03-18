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
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("PLAYER");
  const [message, setMessage] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRequest = async () => {
    setIsLoading(true);

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/tournaments/${tournamentId}/join-requests`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     role,
      //     message: message || null,
      //     invitationCode: invitationCode || null,
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to submit join request");
      // }

      // Mock successful response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Request Submitted",
        description: registrationMode === "INVITATION"
          ? "You have successfully joined the tournament."
          : "Your request to join the tournament has been submitted and is pending approval.",
      });

      // Reset form
      setRole("PLAYER");
      setMessage("");
      setInvitationCode("");

      // Close dialog
      setOpen(false);

      // Notify parent component
      if (onJoinRequested) {
        onJoinRequested();
      }
    } catch (error) {
      console.error("Error submitting join request:", error);
      toast({
        title: "Error",
        description: "Failed to submit join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          <span>Join Tournament</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Join Tournament</DialogTitle>
          <DialogDescription>
            {registrationMode === "OPEN"
              ? "Join this tournament as a player or referee."
              : registrationMode === "INVITATION"
              ? "Enter your invitation code to join this tournament."
              : "Submit a request to join this tournament. The tournament organizer will review your request."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {registrationMode === "INVITATION" && (
            <div className="space-y-2">
              <Label htmlFor="invitationCode">Invitation Code</Label>
              <Input
                id="invitationCode"
                placeholder="Enter your invitation code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLAYER">Player</SelectItem>
                <SelectItem value="REFEREE">Referee</SelectItem>
                <SelectItem value="TEAM_CAPTAIN">Team Captain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {registrationMode === "APPROVAL" && (
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a message to the tournament organizer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Introduce yourself and explain why you want to join this tournament.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleJoinRequest}
            disabled={isLoading || (registrationMode === "INVITATION" && !invitationCode)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : registrationMode === "APPROVAL" ? (
              "Submit Request"
            ) : (
              "Join Tournament"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 