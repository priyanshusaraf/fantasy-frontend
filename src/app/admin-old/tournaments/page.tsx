// src/app/admin/tournaments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter, Edit, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Tournament {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  maxParticipants: number;
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not admin
    if (
      isAuthenticated &&
      user &&
      !["TOURNAMENT_ADMIN", "MASTER_ADMIN"].includes(user.role)
    ) {
      router.push("/");
    }

    const fetchTournaments = async () => {
      try {
        const response = await fetch("/api/admin/tournaments", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tournaments");
        }

        const data = await response.json();
        setTournaments(data.tournaments);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTournaments();
    }
  }, [isAuthenticated, user, router]);

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter
      ? tournament.status === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTournament = () => {
    router.push("/admin/tournaments/create");
  };

  const handleEditTournament = (id: number) => {
    router.push(`/admin/tournaments/${id}/edit`);
  };

  const handleViewTournament = (id: number) => {
    router.push(`/admin/tournaments/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "REGISTRATION_OPEN":
        return "bg-blue-100 text-blue-800";
      case "REGISTRATION_CLOSED":
        return "bg-purple-100 text-purple-800";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        Please log in to access the admin panel.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">Loading tournaments...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#00a1e0]">
          Tournament Management
        </h1>
        <Button
          className="bg-[#00a1e0] hover:bg-[#0072a3]"
          onClick={handleCreateTournament}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search tournaments..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 rounded-md border border-input bg-background h-10"
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="REGISTRATION_CLOSED">Registration Closed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTournaments.length > 0 ? (
                  filteredTournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">
                        {tournament.name}
                      </TableCell>
                      <TableCell>{tournament.location}</TableCell>
                      <TableCell>
                        {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                        {new Date(tournament.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{tournament.type.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tournament.status)}>
                          {tournament.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{tournament.maxParticipants}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTournament(tournament.id)}
                          className="mr-1"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTournament(tournament.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-gray-500"
                    >
                      No tournaments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
