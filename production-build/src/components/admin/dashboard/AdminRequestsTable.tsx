"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  avatar?: string;
}

interface AdminRequestsTableProps {
  requests: AdminRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function AdminRequestsTable({
  requests,
  onApprove,
  onReject,
}: AdminRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No admin requests found.
      </div>
    );
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "TOURNAMENT_ADMIN":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-500 dark:border-blue-800/30";
      case "REFEREE":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-500 dark:border-green-800/30";
      case "MASTER_ADMIN":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-500 dark:border-indigo-800/30";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-500 dark:border-green-800/30";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-500 dark:border-red-800/30";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-500 dark:border-amber-800/30";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/30";
    }
  };

  const formatRole = (role: string) => {
    return role
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Requested</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              className="border-b border-border hover:bg-muted/40 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={request.avatar} alt={request.name} />
                    <AvatarFallback>
                      {request.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{request.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {request.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={getRoleBadgeClass(request.role)}
                >
                  {formatRole(request.role)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDistanceToNow(new Date(request.requestDate), {
                  addSuffix: true,
                })}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={getStatusBadgeClass(request.status)}
                >
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {request.status === "pending" ? (
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(request.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {request.status === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 