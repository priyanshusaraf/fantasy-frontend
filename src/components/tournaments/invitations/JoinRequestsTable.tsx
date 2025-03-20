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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, MessageCircle, Loader2 } from "lucide-react";

interface JoinRequest {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  createdAt: string;
}

interface JoinRequestsTableProps {
  tournamentId: number;
  onRequestUpdated?: () => void;
}

export default function JoinRequestsTable({
  tournamentId,
  onRequestUpdated,
}: JoinRequestsTableProps) {
  const { toast } = useToast();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);

  // Fetch join requests
  const fetchJoinRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join-requests`);
      if (!response.ok) {
        throw new Error("Failed to fetch join requests");
      }
      const data = await response.json();
      setJoinRequests(data);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch join requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle request approval
  const handleApprove = (request: JoinRequest) => {
    setSelectedRequest(request);
    setAction("APPROVE");
    setFeedback("");
    setShowFeedbackDialog(true);
  };

  // Handle request rejection
  const handleReject = (request: JoinRequest) => {
    setSelectedRequest(request);
    setAction("REJECT");
    setFeedback("");
    setShowFeedbackDialog(true);
  };

  // Process the request with feedback
  const processRequest = async () => {
    if (!selectedRequest || !action) return;

    setProcessingId(selectedRequest.id);

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/join-requests`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action.toLowerCase()} join request`);
      }

      // Update local state
      setJoinRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? { ...req, status: action === "APPROVE" ? "APPROVED" : "REJECTED" }
            : req
        )
      );

      toast({
        title: `Request ${action === "APPROVE" ? "Approved" : "Rejected"}`,
        description: `You have ${
          action === "APPROVE" ? "approved" : "rejected"
        } the join request from ${selectedRequest.user.username}.`,
      });

      // Close dialog and reset state
      setShowFeedbackDialog(false);
      setSelectedRequest(null);
      setAction(null);
      setFeedback("");

      // Notify parent component
      if (onRequestUpdated) {
        onRequestUpdated();
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing join request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} join request. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Load join requests on component mount
  useEffect(() => {
    fetchJoinRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Loading join requests...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : joinRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No join requests found.</p>
                </TableCell>
              </TableRow>
            ) : (
              joinRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.user.username}</p>
                      <p className="text-sm text-muted-foreground">{request.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.role.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "PENDING"
                          ? "outline"
                          : request.status === "APPROVED"
                          ? "default"
                          : "destructive"
                      }
                      className={request.status === "APPROVED" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
                    >
                      {request.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {request.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => handleApprove(request)}
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className="hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => handleReject(request)}
                            disabled={processingId === request.id}
                          >
                            {processingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="hidden sm:inline">Reject</span>
                          </Button>
                        </>
                      )}
                      {request.message && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => {
                            toast({
                              title: "Message from " + request.user.username,
                              description: request.message,
                            });
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVE" ? "Approve" : "Reject"} Join Request
            </DialogTitle>
            <DialogDescription>
              {action === "APPROVE"
                ? "Approve this request to allow the user to join the tournament."
                : "Provide a reason for rejecting this join request."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">
                {action === "APPROVE" ? "Additional notes (optional)" : "Reason for rejection"}
              </Label>
              <Textarea
                id="feedback"
                placeholder={
                  action === "APPROVE"
                    ? "Add any additional information for the user..."
                    : "Please provide a reason for rejecting this request..."
                }
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={processRequest}
              disabled={processingId !== null || (action === "REJECT" && !feedback)}
              variant={action === "APPROVE" ? "default" : "destructive"}
            >
              {processingId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : action === "APPROVE" ? (
                "Approve Request"
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 