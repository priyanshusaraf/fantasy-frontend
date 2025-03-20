"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentSelector from "./TournamentSelector";
import { Trophy, Users, Award, ArrowRight } from "lucide-react";
import { FantasyLeaderboard } from "./FantasyLeaderboard";
import { PlayerLeaderboard } from "./PlayerLeaderboard";
import { TeamLeaderboard } from "./TeamLeaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function LeaderboardTabs() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const router = useRouter();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-[#27D3C3]" />
            Your Leaderboard
          </span>
          <Button 
            variant="ghost"
            className="text-sm gap-1 text-[#27D3C3]"
            onClick={() => router.push("/leaderboard")}
          >
            View Global Rankings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fantasy" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="fantasy" className="data-[state=active]:bg-[#27D3C3] data-[state=active]:text-black">
              <Trophy className="h-4 w-4 mr-2" />
              Fantasy
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-[#27D3C3] data-[state=active]:text-black">
              <Users className="h-4 w-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-[#27D3C3] data-[state=active]:text-black">
              <Award className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="fantasy">
            <FantasyLeaderboard 
              tournamentId={selectedTournamentId} 
              contestId={selectedContestId}
              onContestChange={setSelectedContestId}
            />
          </TabsContent>
          
          <TabsContent value="players">
            <PlayerLeaderboard tournamentId={selectedTournamentId} />
          </TabsContent>
          
          <TabsContent value="teams">
            <TeamLeaderboard tournamentId={selectedTournamentId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 