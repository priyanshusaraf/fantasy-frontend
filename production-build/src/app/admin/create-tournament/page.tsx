"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
// import TournamentCreationFlow from "@/components/admin/tournament-creation/TournamentCreationFlow";

export default function CreateTournamentRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    console.log("Redirecting from old /admin/create-tournament to /admin/tournaments/create");
    router.replace("/admin/tournaments/create");
  }, [router]);
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold">Redirecting...</h1>
      <p>Redirecting to the tournament creation page</p>
    </div>
  );
}
