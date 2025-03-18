"use client";
import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  EyeIcon,
  UserPlus,
  Shield,
  Award,
  Filter,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// Define User interface
interface User {
  id: string;
  name: string | null;
  email: string;
  username?: string | null;
  role: string;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  image?: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  
  // Derived state - calculate these only when dependencies change
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Fetch users - defined with useCallback to avoid recreating on every render
  const fetchUsers = useCallback(async () => {
    if (status !== "authenticated") return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      
      // Set all user-related state in one place to avoid multiple renders
      setUsers(data.users || []);
      
      // Don't calculate these values on every render
      const pendingCount = (data.users || []).filter((user: User) => !user.isApproved).length;
      setPendingApprovals(pendingCount);
      setTotalUsers(data.users?.length || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication and fetch data
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

    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, session, router, fetchUsers]);

  // Filter users based on search and filters - only run when these values change
  useEffect(() => {
    if (!users.length) {
      setFilteredUsers([]);
      return;
    }

    let result = [...users];

    if (searchTerm) {
      result = result.filter(
        (user) =>
          (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter);
    }

    if (approvalFilter) {
      result = result.filter((user) =>
        approvalFilter === "approved" ? user.isApproved : !user.isApproved
      );
    }
    
    // Use functional update to avoid potential circular dependency
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, approvalFilter, users]);

  // Handle user role change - defined with useCallback 
  const handleChangeRole = useCallback(async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to change role");
      }

      // Update local state to avoid refetching all users
      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        );
        return updatedUsers;
      });

      toast.success(`Role changed to ${newRole} successfully`);
      
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Failed to change role. Please try again.");
    }
  }, []);

  // Handle user approval - defined with useCallback
  const handleApproveUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve user");
      }

      // Update local state to avoid refetching all users
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isApproved: true } : user
        )
      );

      // Update pending approvals count
      setPendingApprovals((prev) => prev - 1);

      toast.success("User approved successfully");
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    }
  }, []);

  // Helper function to get role badge styling
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "MASTER_ADMIN":
        return "bg-red-100 text-red-800";
      case "TOURNAMENT_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "REFEREE":
        return "bg-blue-100 text-blue-800";
      case "PLAYER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#00a1e0]">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage users, approvals, and permissions
          </p>
        </div>
        <Button
          className="mt-4 md:mt-0 bg-[#00a1e0] hover:bg-[#0072a3]"
          onClick={() => router.push("/admin/invite-user")}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-bold">{pendingApprovals}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Admin Users</p>
              <p className="text-2xl font-bold">
                {users.filter(u => 
                  u.role === "MASTER_ADMIN" || u.role === "TOURNAMENT_ADMIN"
                ).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={roleFilter || ""}
                onChange={(e) => setRoleFilter(e.target.value || null)}
              >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="PLAYER">Player</option>
                <option value="REFEREE">Referee</option>
                <option value="TOURNAMENT_ADMIN">Tournament Admin</option>
                <option value="MASTER_ADMIN">Master Admin</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={approvalFilter || ""}
                onChange={(e) => setApprovalFilter(e.target.value || null)}
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name/Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.name || user.username || "Unnamed User"}</div>
                          {user.username && user.name && (
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${getRoleBadgeColor(user.role)}`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isApproved ? (
                            <Badge className="bg-green-100 text-green-800">
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/admin/users/${user.id}`)
                                }
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              {!user.isApproved && (
                                <DropdownMenuItem
                                  onClick={() => handleApproveUser(user.id)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve User
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuLabel>
                                Change Role
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeRole(user.id, "USER")
                                }
                                disabled={user.role === "USER"}
                              >
                                Set as User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeRole(user.id, "PLAYER")
                                }
                                disabled={user.role === "PLAYER"}
                              >
                                Set as Player
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeRole(user.id, "REFEREE")
                                }
                                disabled={user.role === "REFEREE"}
                              >
                                Set as Referee
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleChangeRole(user.id, "TOURNAMENT_ADMIN")
                                }
                                disabled={user.role === "TOURNAMENT_ADMIN"}
                              >
                                Set as Tournament Admin
                              </DropdownMenuItem>
                              {session?.user?.role === "MASTER_ADMIN" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeRole(user.id, "MASTER_ADMIN")
                                  }
                                  disabled={user.role === "MASTER_ADMIN"}
                                >
                                  Set as Master Admin
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-4 text-gray-500"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 