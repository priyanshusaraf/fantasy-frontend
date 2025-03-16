"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, Award, Star, Info, ArrowUp, ArrowDown, BarChart3, Shield, Zap, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PlayerStats {
  wins: number;
  losses: number;
  aces: number;
  errors: number;
  points: number;
  killShots: number;
  dinks: number;
  returnsWon: number;
}

interface FantasyPointsCardProps {
  playerName: string;
  playerPosition: string;
  skillLevel: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  stats: PlayerStats;
  totalPoints: number;
  matchesPlayed: number;
  price: number;
  ownership: number;
  className?: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const getSkillLevelColor = (skillLevel: string) => {
  switch (skillLevel.toLowerCase()) {
    case 'pro':
      return 'bg-purple-500';
    case 'advanced':
      return 'bg-blue-500';
    case 'intermediate':
      return 'bg-green-500';
    case 'beginner':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export function FantasyPointsCard({
  playerName,
  playerPosition,
  skillLevel,
  isCaptain,
  isViceCaptain,
  stats,
  totalPoints,
  matchesPlayed,
  price,
  ownership,
  className
}: FantasyPointsCardProps) {
  // Calculate points per stat category
  const winPoints = stats.wins * 10;
  const acePoints = stats.aces * 2;
  const killShotPoints = stats.killShots * 1.5;
  const dinkPoints = stats.dinks * 0.5;
  const returnPoints = stats.returnsWon * 1;
  const errorPenalty = stats.errors * -1;
  
  // Apply captain/vice-captain multiplier
  const roleMultiplier = isCaptain ? 2 : isViceCaptain ? 1.5 : 1;
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  };
  
  // Calculate points per match
  const pointsPerMatch = matchesPlayed > 0 ? totalPoints / matchesPlayed : 0;
  
  return (
    <Card className={`w-full overflow-hidden transition-all hover:shadow-md ${className}`}>
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{playerName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{playerPosition}</Badge>
              <Badge variant="secondary">{skillLevel}</Badge>
              
              {isCaptain && (
                <Tooltip delayDuration={300} content="Captain (2x points)">
                  <div>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                      <Star className="h-3 w-3 mr-1" />
                      C
                    </Badge>
                  </div>
                </Tooltip>
              )}
              
              {isViceCaptain && (
                <Tooltip delayDuration={300} content="Vice Captain (1.5x points)">
                  <div>
                    <Badge className="bg-blue-500 hover:bg-blue-600">
                      <Award className="h-3 w-3 mr-1" />
                      VC
                    </Badge>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">
              {totalPoints}
              <span className="text-xs text-muted-foreground ml-1">pts</span>
            </div>
            <div className="text-xs text-muted-foreground">
              ${price.toFixed(1)}M
              <span className="ml-2">
                {ownership}% owned
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Separator className="mb-4" />
        
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="flex flex-col items-center">
            <div className="text-muted-foreground flex items-center mb-1">
              <BarChart3 className="h-3 w-3 mr-1" />
              <span>PPM</span>
            </div>
            <div className="font-medium">{formatNumber(pointsPerMatch)}</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-muted-foreground flex items-center mb-1">
              <User className="h-3 w-3 mr-1" />
              <span>Matches</span>
            </div>
            <div className="font-medium">{matchesPlayed}</div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-muted-foreground flex items-center mb-1">
              <Zap className="h-3 w-3 mr-1" />
              <span>Multiplier</span>
            </div>
            <div className="font-medium">{roleMultiplier}x</div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="text-xs">
          <h4 className="font-medium mb-2">Points Breakdown</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Wins ({stats.wins})</span>
              <Badge variant={winPoints > 0 ? "default" : "outline"}>
                <ArrowUp className={`h-3 w-3 mr-1 ${winPoints > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                {formatNumber(winPoints)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Aces ({stats.aces})</span>
              <Badge variant={acePoints > 0 ? "default" : "outline"}>
                <ArrowUp className={`h-3 w-3 mr-1 ${acePoints > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                {formatNumber(acePoints)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Kill Shots ({stats.killShots})</span>
              <Badge variant={killShotPoints > 0 ? "default" : "outline"}>
                <ArrowUp className={`h-3 w-3 mr-1 ${killShotPoints > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                {formatNumber(killShotPoints)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dinks ({stats.dinks})</span>
              <Badge variant={dinkPoints > 0 ? "default" : "outline"}>
                <ArrowUp className={`h-3 w-3 mr-1 ${dinkPoints > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                {formatNumber(dinkPoints)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Returns Won ({stats.returnsWon})</span>
              <Badge variant={returnPoints > 0 ? "default" : "outline"}>
                <ArrowUp className={`h-3 w-3 mr-1 ${returnPoints > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                {formatNumber(returnPoints)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Errors ({stats.errors})</span>
              <Badge variant="destructive">
                <ArrowDown className="h-3 w-3 mr-1" />
                {formatNumber(Math.abs(errorPenalty))}
              </Badge>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center font-medium">
              <span>Base Points</span>
              <span>{formatNumber(winPoints + acePoints + killShotPoints + dinkPoints + returnPoints + errorPenalty)}</span>
            </div>
            
            {(isCaptain || isViceCaptain) && (
              <div className="flex justify-between items-center font-medium">
                <span>Role Bonus ({roleMultiplier}x)</span>
                <span className="text-green-600">
                  +{formatNumber(totalPoints - (winPoints + acePoints + killShotPoints + dinkPoints + returnPoints + errorPenalty))}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center font-bold mt-2">
              <span>Total Points</span>
              <span>{formatNumber(totalPoints)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 