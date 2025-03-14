import React from "react";
import { Metadata } from "next";
import CreateTournamentForm from "@/components/tournaments/create-tournament-form";

export const metadata: Metadata = {
  title: "Create Tournament | Pickleball Fantasy",
  description: "Create a new pickleball tournament for fantasy gameplay",
};

export default function CreateTournamentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Tournament</h1>
        <p className="text-gray-600 mt-2">
          Set up a new tournament with fantasy contests for your players.
        </p>
      </div>

      <CreateTournamentForm />
    </div>
  );
}
