// src/app/(protected)/users/page.tsx
"use client";
import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

// Define User interface
interface User {
  id: number;
  username: string;
  email: string;
  role: "USER" | "PLAYER" | "REFEREE" | "TOURNAMENT_ADMIN" | "MASTER_ADMIN";
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
}

// Mock data - in a real application this would come from API
const MOCK_USERS: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    role: "MASTER_ADMIN",
    isVerified: true,
    isApproved: true,
    createdAt: "2023-01-10T10:00:00Z",
  },
  {
    id: 2,
    username: "john.doe",
    email: "john.doe@example.com",
    role: "USER",
    isVerified: true,
    isApproved: true,
    createdAt: "2023-02-15T11:30:00Z",
  },
  {
    id: 3,
    username: "jane.smith",
    email: "jane.smith@example.com",
    role: "PLAYER",
    isVerified: true,
    isApproved: true,
    createdAt: "2023-03-20T09:45:00Z",
  },
  {
    id: 4,
    username: "referee1",
    email: "referee1@example.com",
    role: "REFEREE",
    isVerified: true,
    isApproved: true,
    createdAt: "2023-04-05T14:20:00Z",
  },
  {
    id: 5,
    username: "tournament.admin",
    email: "tournament.admin@example.com",
    role: "TOURNAMENT_ADMIN",
    isVerified: true,
    isApproved: true,
    createdAt: "2023-05-12T16:10:00Z",
  },
  {
    id: 6,
    username: "pending.referee",
    email: "pending.referee@example.com",
    role: "REFEREE",
    isVerified: true,
    isApproved: false,
    createdAt: "2023-06-20T13:25:00Z",
  },
  {
    id: 7,
    username: "pending.player",
    email: "pending.player@example.com",
    role: "PLAYER",
    isVerified: true,
    isApproved: false,
    createdAt: "2023-07-08T10:15:00Z",
  },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Fetch users from API (mocked with setTimeout)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // In a real app, replace this with actual API call
        // const response = await fetch('/api/users');
        // const data = await response.json();

        // Using mock data for demonstration
        setTimeout(() => {
          setUsers(MOCK_USERS);
          setFilteredUsers(MOCK_USERS);
          setTotalUsers(MOCK_USERS.length);
          setPendingApprovals(
            MOCK_USERS.filter((user) => !user.isApproved).length
          );
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term and filters
  useEffect(() => {
    let result = users;

    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredUsers(result);
  }, [searchTerm, roleFilter, approvalFilter, users]);

  const handleApproveUser = async (userId: number) => {
    try {
      // In a real app, make an API call to approve the user
      // await fetch(`/api/users/${userId}/approve`, { method: 'POST' });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isApproved: true } : user
        )
      );

      toast.success("User approved successfully");
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user");
    }
  };

  const handleChangeRole = async (userId: number, newRole: User["role"]) => {
    try {
      // In a real app, make an API call to change the role
      // await fetch(`/api/users/${userId}/role`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ role: newRole })
      // });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`Role changed to ${newRole} successfully`);
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Failed to change role");
    }
  };

  const getRoleBadgeColor = (role: User["role"]) => {
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

  return (
    <AuthGuard>
      <AdminGuard>
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
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved Users</p>
                  <p className="text-2xl font-bold">
                    {totalUsers - pendingApprovals}
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
                    type="search"
                    placeholder="Search by username or email..."
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
                  <option value="USER">User</option>
                  <option value="PLAYER">Player</option>
                  <option value="REFEREE">Referee</option>
                  <option value="TOURNAMENT_ADMIN">Tournament Admin</option>
                  <option value="MASTER_ADMIN">Master Admin</option>
                </select>

                <select
                  className="px-3 py-2 rounded-md border border-input bg-background h-10"
                  value={approvalFilter || ""}
                  onChange={(e) => setApprovalFilter(e.target.value || null)}
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
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
                            <TableCell className="font-medium">
                              {user.username}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {user.role.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.isApproved ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800"
                                >
                                  Approved
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-800"
                                >
                                  Pending Approval
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
                                      handleChangeRole(
                                        user.id,
                                        "TOURNAMENT_ADMIN"
                                      )
                                    }
                                    disabled={user.role === "TOURNAMENT_ADMIN"}
                                  >
                                    Set as Tournament Admin
                                  </DropdownMenuItem>

                                  {!user.isApproved && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleApproveUser(user.id)
                                        }
                                        className="text-green-600"
                                      >
                                        Approve User
                                      </DropdownMenuItem>
                                    </>
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
                            No users found matching your criteria
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
      </AdminGuard>
    </AuthGuard>
  );
}
