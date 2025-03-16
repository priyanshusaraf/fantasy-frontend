"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-[#00a1e0]">
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Manage tournaments, players, and user approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button onClick={() => router.push("/admin/tournaments/create")}>
              Create Tournament
            </Button>
            <Button onClick={() => router.push("/admin/tournaments")}>
              Manage Tournaments
            </Button>
            <Button onClick={() => router.push("/admin/player-management")}>
              Player Management
            </Button>
            <Button onClick={() => router.push("/admin/user-approvals")}>
              User Approvals
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            Admin panel © {new Date().getFullYear()}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
