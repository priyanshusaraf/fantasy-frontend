"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/Input";
import { AlertCircle, Check, X, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface UserApproval {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  image?: string | null;
}

export default function UserApprovalsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [pendingUsers, setPendingUsers] = useState<UserApproval[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserApproval | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("pending");

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (
      status === "authenticated" &&
      session?.user?.role !== "MASTER_ADMIN" &&
      session?.user?.role !== "TOURNAMENT_ADMIN"
    ) {
      router.push("/unauthorized");
      return;
    }

    // Fetch pending user approvals
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/user-approvals", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user approvals");
        }

        const data = await response.json();
        setPendingUsers(data.pendingUsers || []);
        setApprovedUsers(data.approvedUsers || []);
      } catch (error) {
        console.error("Error fetching user approvals:", error);
        toast.error("Failed to load user approvals");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, session, router]);

  // Filter users based on search term and role filter
  const getFilteredUsers = (users: UserApproval[]) => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter ? user.role === roleFilter : true;

      return matchesSearch && matchesRole;
    });
  };

  const filteredPendingUsers = getFilteredUsers(pendingUsers);
  const filteredApprovedUsers = getFilteredUsers(approvedUsers);

  // Handle user approval
  const handleApprove = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/admin/user-approvals/${selectedUser.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve user");
      }

      // Update local state
      const updatedUser = await response.json();
      setPendingUsers(
        pendingUsers.filter((user) => user.id !== selectedUser.id)
      );
      setApprovedUsers([updatedUser, ...approvedUsers]);

      toast.success(`${selectedUser.name} has been approved`);
      setIsApproveDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    }
  };

  // Handle user rejection
  const handleReject = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/admin/user-approvals/${selectedUser.id}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject user");
      }

      // Update local state
      setPendingUsers(
        pendingUsers.filter((user) => user.id !== selectedUser.id)
      );

      toast.success(`${selectedUser.name}'s application has been rejected`);
      setIsRejectDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user");
    }
  };

  // Loading state
  if (
    status === "loading" ||
    (loading && pendingUsers.length === 0 && approvedUsers.length === 0)
  ) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a1e0]"></div>
        </div>
      </div>
    );
  }

  // Not authorized
  if (
    status === "authenticated" &&
    session?.user?.role !== "MASTER_ADMIN" &&
    session?.user?.role !== "TOURNAMENT_ADMIN"
  ) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#00a1e0]">User Approvals</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Manage User Approvals</CardTitle>
          <CardDescription>
            Approve or reject user registration requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 rounded-md border border-input bg-background h-10"
              value={roleFilter || ""}
              onChange={(e) => setRoleFilter(e.target.value || null)}
            >
              <option value="">All Roles</option>
              <option value="PLAYER">Player</option>
              <option value="REFEREE">Referee</option>
              <option value="TOURNAMENT_ADMIN">Tournament Admin</option>
            </select>
          </div>

          <Tabs
            defaultValue="pending"
            value={currentTab}
            onValueChange={setCurrentTab}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending Approvals{" "}
                {pendingUsers.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved Users</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {filteredPendingUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.role === "PLAYER"
                                  ? "bg-green-100 text-green-800"
                                  : user.role === "REFEREE"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }
                            >
                              {user.role.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-100 text-green-800 hover:bg-green-200"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsApproveDialogOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-100 text-red-800 hover:bg-red-200"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsRejectDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4 text-gray-500">
                    No pending approval requests
                  </p>
                  {searchTerm || roleFilter ? (
                    <p className="text-sm text-gray-400 mt-2">
                      Try adjusting your search filters
                    </p>
                  ) : null}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {filteredApprovedUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Approved On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApprovedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.role === "PLAYER"
                                  ? "bg-green-100 text-green-800"
                                  : user.role === "REFEREE"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }
                            >
                              {user.role.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-4 text-gray-500">No approved users found</p>
                  {searchTerm || roleFilter ? (
                    <p className="text-sm text-gray-400 mt-2">
                      Try adjusting your search filters
                    </p>
                  ) : null}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      {selectedUser && (
        <Dialog
          open={isApproveDialogOpen}
          onOpenChange={setIsApproveDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve User</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve {selectedUser.name} as a{" "}
                {selectedUser.role.toLowerCase().replace("_", " ")}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleApprove} className="ml-2">
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {selectedUser && (
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject User</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject {selectedUser.name}s
                application?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleReject} className="ml-2">
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
