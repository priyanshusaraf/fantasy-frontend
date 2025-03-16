import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirecting to Tournament Creation | MatchUp",
  description: "Redirecting to the tournament creation page",
};

export default function CreateTournamentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 