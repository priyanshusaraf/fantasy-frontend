"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Copy, Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Invitation {
  id: number;
  invitedEmail: string;
  invitedUser: {
    id: number;
    username: string;
    email: string;
  } | null;
  role: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  invitationCode: string;
  createdAt: string;
  expiresAt: string;
}

interface ActiveInvitationsTableProps {
  tournamentId: number;
  onInvitationCancelled?: () => void;
}

export default function ActiveInvitationsTable({
  tournamentId,
  onInvitationCancelled,
}: ActiveInvitationsTableProps) {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch invitations
  const fetchInvitations = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/tournaments/${tournamentId}/invitations`);
      // if (!response.ok) {
      //   throw new Error("Failed to fetch invitations");
      // }
      // const data = await response.json();
      // setInvitations(data);

      // Mock data for demonstration
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockInvitations: Invitation[] = [
        {
          id: 1,
          invitedEmail: "john.doe@example.com",
          invitedUser: {
            id: 101,
            username: "johndoe",
            email: "john.doe@example.com",
          },
          role: "PLAYER",
          status: "PENDING",
          invitationCode: "abc123def456",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          invitedEmail: "sarah.jones@example.com",
          invitedUser: null,
          role: "REFEREE",
          status: "PENDING",
          invitationCode: "xyz789abc012",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          invitedEmail: "mike.brown@example.com",
          invitedUser: {
            id: 103,
            username: "mikebrown",
            email: "mike.brown@example.com",
          },
          role: "PLAYER",
          status: "ACCEPTED",
          invitationCode: "def456ghi789",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setInvitations(mockInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invitations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy invitation code to clipboard
  const handleCopyCode = (invitation: Invitation) => {
    navigator.clipboard.writeText(invitation.invitationCode);
    setCopiedId(invitation.id);
    
    setTimeout(() => {
      setCopiedId(null);
    }, 3000);
    
    toast({
      title: "Copied to Clipboard",
      description: "Invitation code has been copied to clipboard.",
    });
  };

  // Resend invitation email
  const handleResendInvitation = async (invitation: Invitation) => {
    setProcessingId(invitation.id);
    
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/tournaments/${tournamentId}/invitations/${invitation.id}/resend`, {
      //   method: "POST",
      // });
      
      // if (!response.ok) {
      //   throw new Error("Failed to resend invitation");
      // }
      
      // Mock successful response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Invitation Resent",
        description: `Invitation has been resent to ${invitation.invitedEmail}.`,
      });
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitation: Invitation) => {
    setProcessingId(invitation.id);
    
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/tournaments/${tournamentId}/invitations`, {
      //   method: "DELETE",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ invitationId: invitation.id }),
      // });
      
      // if (!response.ok) {
      //   throw new Error("Failed to cancel invitation");
      // }
      
      // Mock successful response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update local state
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      
      toast({
        title: "Invitation Cancelled",
        description: `Invitation to ${invitation.invitedEmail} has been cancelled.`,
      });
      
      // Notify parent component
      if (onInvitationCancelled) {
        onInvitationCancelled();
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Load invitations on component mount
  useEffect(() => {
    fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Loading invitations...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No active invitations found.</p>
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invitation.invitedEmail}</p>
                      {invitation.invitedUser && (
                        <p className="text-sm text-muted-foreground">
                          {invitation.invitedUser.username}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invitation.role.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invitation.status === "PENDING"
                          ? "outline"
                          : invitation.status === "ACCEPTED"
                          ? "default"
                          : invitation.status === "REJECTED"
                          ? "destructive"
                          : "secondary"
                      }
                      className={invitation.status === "ACCEPTED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
                    >
                      {invitation.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.expiresAt) > new Date()
                      ? new Date(invitation.expiresAt).toLocaleDateString()
                      : "Expired"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invitation.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleCopyCode(invitation)}
                            disabled={processingId === invitation.id}
                          >
                            {copiedId === invitation.id ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleResendInvitation(invitation)}
                            disabled={processingId === invitation.id}
                          >
                            {processingId === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleCancelInvitation(invitation)}
                            disabled={processingId === invitation.id}
                          >
                            {processingId === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 