"use client";

import React from "react";
import { Metadata } from "next";
import TournamentCreationFlow from "@/components/admin/tournament-creation/TournamentCreationFlow";

export const metadata: Metadata = {
  title: "Create Tournament | MatchUp",
  description: "Create a new tournament",
};

export default function CreateTournamentPage() {
  return (
    <div className="container py-6">
      <TournamentCreationFlow />
    </div>
  );
}
