"use client";

import React from "react";
import { TrendingUp, Users, Trophy, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  upcomingTournaments: number;
  completedTournaments: number;
  totalPlayers: number;
  averagePlayersPerTournament: number;
  tournamentsGrowth: number;
}

interface TournamentStatisticsProps {
  stats: TournamentStats | null;
  showDetailed?: boolean;
}

export function TournamentStatistics({
  stats,
  showDetailed = false,
}: TournamentStatisticsProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tournament stats available.
      </div>
    );
  }

  // Function to calculate percentage of a tournament status
  const getPercentage = (value: number) => {
    return Math.round((value / stats.totalTournaments) * 100);
  };

  // Tournament Status Breakdown
  const statusData = [
    {
      label: "Active",
      value: stats.activeTournaments,
      percentage: getPercentage(stats.activeTournaments),
      color: "bg-primary",
      icon: <Trophy className="h-4 w-4 text-primary" />,
    },
    {
      label: "Upcoming",
      value: stats.upcomingTournaments,
      percentage: getPercentage(stats.upcomingTournaments),
      color: "bg-cyan-500",
      icon: <Calendar className="h-4 w-4 text-cyan-500" />,
    },
    {
      label: "Completed",
      value: stats.completedTournaments,
      percentage: getPercentage(stats.completedTournaments),
      color: "bg-green-500",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Total Tournaments</div>
          <div className="text-2xl font-bold">{stats.totalTournaments}</div>
          {stats.tournamentsGrowth > 0 && (
            <div className="flex items-center text-xs text-green-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.tournamentsGrowth.toFixed(1)}% vs last month
            </div>
          )}
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Total Players</div>
          <div className="text-2xl font-bold">{stats.totalPlayers}</div>
          <div className="text-xs text-muted-foreground">
            Avg. {stats.averagePlayersPerTournament} per tournament
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">Tournament Status</div>
        
        {statusData.map((status, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                {status.icon}
                <span>{status.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{status.value}</span>
                <span className="text-xs text-muted-foreground">
                  {status.percentage}%
                </span>
              </div>
            </div>
            <Progress value={status.percentage} className={status.color} />
          </div>
        ))}
      </div>

      {showDetailed && (
        <>
          <div className="h-px bg-border my-4"></div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Player Distribution</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Pro Players</span>
                      <span>32%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "32%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Amateur Players</span>
                      <span>48%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: "48%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Recreational Players</span>
                      <span>20%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "20%" }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span>Tournament Types</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Singles</span>
                      <span>40%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "40%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Doubles</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Mixed Doubles</span>
                      <span>15%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "15%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 