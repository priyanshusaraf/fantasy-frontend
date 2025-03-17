"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Trophy, Medal, AlertCircle, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
}

interface UpdateEvent {
  id: string;
  timestamp: string;
  type: "score" | "point" | "match" | "contest";
  description: string;
  points?: number;
  player?: Player;
  team?: Team;
  matchId?: number;
  contestId?: number;
  isPositive?: boolean;
}

interface RecentUpdatesCardProps {
  updates: UpdateEvent[];
  loading?: boolean;
  title?: string;
  description?: string;
  onRefresh?: () => void;
  lastUpdated?: Date;
  maxHeight?: string;
  refreshInterval?: number;
}

export default function RecentUpdatesCard({
  updates,
  loading = false,
  title = "Recent Updates",
  description,
  onRefresh,
  lastUpdated,
  maxHeight = "400px",
  refreshInterval,
}: RecentUpdatesCardProps) {
  // Format the relative time (e.g., "2 minutes ago")
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };
  
  // Get icon based on event type
  const getEventIcon = (event: UpdateEvent) => {
    switch (event.type) {
      case "score":
        return event.isPositive ? 
          <Check className="h-4 w-4 text-green-400" /> : 
          <X className="h-4 w-4 text-red-400" />;
      case "point":
        return event.isPositive ? 
          <Trophy className="h-4 w-4 text-yellow-400" /> : 
          <AlertCircle className="h-4 w-4 text-orange-400" />;
      case "match":
        return <Medal className="h-4 w-4 text-blue-400" />;
      case "contest":
        return <Trophy className="h-4 w-4 text-purple-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Get badge styling based on event type
  const getEventBadge = (event: UpdateEvent) => {
    if (event.points === undefined) return null;
    
    const isPositive = event.points > 0;
    
    return (
      <Badge 
        className={cn(
          "ml-2", 
          isPositive 
            ? "bg-green-600/30 text-green-300" 
            : "bg-red-600/30 text-red-300"
        )}
      >
        {isPositive ? "+" : ""}{event.points.toFixed(1)}
      </Badge>
    );
  };
  
  return (
    <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="text-gray-400">{description}</CardDescription>
            )}
          </div>
          
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRefresh}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className={`w-full h-full ${maxHeight ? `max-h-[${maxHeight}]` : ""}`}>
          <div className="p-4 space-y-3">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3 animate-pulse">
                  <div className="mt-1 h-4 w-4 rounded-full bg-gray-700" />
                  <div className="flex-grow">
                    <div className="h-4 bg-gray-700 rounded-md w-3/4 mb-2" />
                    <div className="h-3 bg-gray-700 rounded-md w-1/2" />
                  </div>
                  <div className="h-4 w-16 bg-gray-700 rounded-md" />
                </div>
              ))
            ) : updates.length > 0 ? (
              updates.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-700/40 transition-colors"
                >
                  <div className="mt-1">{getEventIcon(event)}</div>
                  
                  <div className="flex-grow">
                    <p className="text-sm text-white">{event.description}</p>
                    {event.player && (
                      <p className="text-xs text-gray-400">Player: {event.player.name}</p>
                    )}
                    {event.team && (
                      <p className="text-xs text-gray-400">Team: {event.team.name}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    {getEventBadge(event)}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <AlertCircle className="h-8 w-8 mb-2 text-gray-500" />
                <p>No recent updates</p>
                <p className="text-xs mt-1">Updates will appear here as they happen</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {lastUpdated && (
        <CardFooter className="pt-2 pb-3 text-xs text-gray-500 border-t border-gray-700">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {refreshInterval && (
            <span className="ml-1">
              (auto-refreshes every {refreshInterval / 1000}s)
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  );
} 