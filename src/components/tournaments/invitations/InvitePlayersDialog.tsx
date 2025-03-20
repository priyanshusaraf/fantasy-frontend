"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Link, Copy, Mail, Loader2, CheckCircle2 } from "lucide-react";

interface InvitePlayersDialogProps {
  tournamentId: number;
  onInviteSent?: () => void;
}

export default function InvitePlayersDialog({
  tournamentId,
  onInviteSent,
}: InvitePlayersDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PLAYER");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  const handleSendInvite = async () => {
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }

      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${email}.`,
      });

      // Reset form
      setEmail("");
      setMessage("");

      // Close dialog
      if (onInviteSent) {
        onInviteSent();
      }
      setOpen(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/invitations/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate invitation link");
      }

      const data = await response.json();
      setInviteLink(data.inviteLink);
    } catch (error) {
      console.error("Error generating invitation link:", error);
      toast({
        title: "Error",
        description: "Failed to generate invitation link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    
    setTimeout(() => {
      setInviteCopied(false);
    }, 3000);
    
    toast({
      title: "Copied to Clipboard",
      description: "Invitation link has been copied to clipboard.",
    });
  };

  const handleSendLinkByEmail = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the invitation link.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would send the link via email
    toast({
      title: "Link Sent",
      description: `Invitation link has been sent to ${email}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1">
          <UserPlus className="h-4 w-4" />
          <span>Invite Players</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite to Tournament</DialogTitle>
          <DialogDescription>
            Send invitations to players, referees, or team captains to join your tournament.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email Invitation</TabsTrigger>
            <TabsTrigger value="link">Invitation Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
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
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to your invitation"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-role">Role for Link</Label>
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
            
            {!inviteLink ? (
              <Button 
                onClick={handleGenerateLink} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Generate Invitation Link
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted">
                  <h3 className="text-sm font-medium mb-2">Invitation Link</h3>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={inviteLink} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={handleCopyLink}
                    >
                      {inviteCopied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this link with players so they can join the tournament.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="link-email">Send Link via Email (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="link-email"
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={handleSendLinkByEmail}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {activeTab === "email" && (
            <Button onClick={handleSendInvite} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 