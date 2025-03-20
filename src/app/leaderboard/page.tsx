"use client";

import LeaderboardTabs from "@/components/leaderboard/LeaderboardTabs";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gradient-to-b from-background to-background/80 min-h-screen">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4 pl-0 flex items-center gap-2 hover:bg-transparent hover:text-blue-500"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          Global Leaderboards
        </h1>
        <p className="text-gray-400 mt-1">
          View rankings across all tournaments and fantasy contests
        </p>
      </div>
      
      <LeaderboardTabs />
    </div>
  );
}
