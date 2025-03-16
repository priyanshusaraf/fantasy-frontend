"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

interface FantasyStats {
  totalContests: number;
  activeContests: number;
  totalPrizePool: number;
  averageEntryFee: number;
  contestsGrowth: number;
  prizePoolGrowth: number;
}

interface FantasyStatsCardProps {
  stats: FantasyStats | null;
  showDetailed?: boolean;
}

export function FantasyStatsCard({
  stats,
  showDetailed = false,
}: FantasyStatsCardProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fantasy stats available.
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Total Contests</div>
          <div className="text-2xl font-bold">{stats.totalContests}</div>
          {stats.contestsGrowth > 0 && (
            <div className="flex items-center text-xs text-green-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.contestsGrowth.toFixed(1)}% vs last month
            </div>
          )}
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Active Contests</div>
          <div className="text-2xl font-bold">{stats.activeContests}</div>
          <div className="text-xs text-muted-foreground">
            {((stats.activeContests / stats.totalContests) * 100).toFixed(1)}% of total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Prize Pool</div>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalPrizePool)}
          </div>
          {stats.prizePoolGrowth > 0 && (
            <div className="flex items-center text-xs text-green-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{stats.prizePoolGrowth.toFixed(1)}% vs last month
            </div>
          )}
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground">Average Entry Fee</div>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.averageEntryFee)}
          </div>
          <div className="text-xs text-muted-foreground">
            Per contest entry
          </div>
        </div>
      </div>

      {showDetailed && (
        <>
          <div className="h-px bg-border my-4"></div>
          
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Contest Fill Rate</span>
                <span className="text-xs font-medium">87%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "87%" }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Average percentage of available slots filled per contest
              </div>
            </div>
            
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">User Participation</span>
                <span className="text-xs font-medium">64%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "64%" }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Percentage of users who joined at least one contest
              </div>
            </div>
            
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Repeat Entry Rate</span>
                <span className="text-xs font-medium">78%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: "78%" }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Users who participate in multiple contests
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 