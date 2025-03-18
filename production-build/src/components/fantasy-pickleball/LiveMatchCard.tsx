"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Flame, ChevronRight, Clock, Users, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FantasyPlayer {
  id: number;
  name: string;
  imageUrl?: string;
  country?: string;
  skillLevel?: string;
  fantasyPoints?: number;
  isInUserTeam?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

interface Match {
  id: number;
  contestId: number;
  teamA?: {
    id: number;
    name: string;
    profileImage?: string;
    score: number;
    ownership?: number;
  };
  teamB?: {
    id: number;
    name: string;
    profileImage?: string;
    score: number;
    ownership?: number;
  };
  tournamentId: number;
  tournamentName: string;
  round: string;
  player1?: FantasyPlayer;
  player2?: FantasyPlayer;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "upcoming" | "live" | "completed";
  player1Score?: number;
  player2Score?: number;
  startTime: string;
  endTime?: string;
  court?: string;
  courtNumber?: number;
  ownershipPercentage?: number;
}

interface LiveMatchCardProps {
  match: Match;
  contestId?: number;
  onViewDetails?: (matchId: number) => void;
}

export default function LiveMatchCard({ match, contestId, onViewDetails }: LiveMatchCardProps) {
  const isInProgress = match.status === "IN_PROGRESS" || match.status === "live";
  const isCompleted = match.status === "COMPLETED" || match.status === "completed";
  
  // Format the time as a relative string (e.g., "2 hours ago")
  const startTimeRelative = formatDistanceToNow(new Date(match.startTime), { addSuffix: true });
  
  // Function to determine if a player is winning
  const isPlayerWinning = (playerNum: 1 | 2) => {
    if (match.player1Score !== undefined && match.player2Score !== undefined) {
      return playerNum === 1 
        ? match.player1Score > match.player2Score 
        : match.player2Score > match.player1Score;
    } else if (match.teamA && match.teamB) {
      return playerNum === 1 
        ? match.teamA.score > match.teamB.score 
        : match.teamB.score > match.teamA.score;
    }
    return false;
  };
  
  // Calculate point difference
  const getScoreDifference = () => {
    if (match.player1Score !== undefined && match.player2Score !== undefined) {
      return Math.abs(match.player1Score - match.player2Score);
    } else if (match.teamA && match.teamB) {
      return Math.abs(match.teamA.score - match.teamB.score);
    }
    return 0;
  };
  
  const scoreDifference = getScoreDifference();
  
  // Determine if the match is a close match (defined as 3 points or less difference)
  const isCloseMatch = isInProgress && scoreDifference <= 3;
  
  // Format ownership percentage
  const ownershipFormatted = match.ownershipPercentage 
    ? `${match.ownershipPercentage}% owned` 
    : "Ownership unknown";
  
  // Handle different match data formats
  const renderMatch = () => {
    if (match.player1 && match.player2 && match.player1Score !== undefined && match.player2Score !== undefined) {
      return (
        <>
          {/* Player 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div 
                  className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold 
                    ${match.player1.isInUserTeam ? 'border-2 border-[#27D3C3]' : ''}
                  `}
                >
                  {match.player1.imageUrl 
                    ? <img src={match.player1.imageUrl} alt={match.player1.name} className="w-full h-full rounded-full object-cover" />
                    : match.player1.name.charAt(0)}
                </div>
                
                {/* Captain/Vice-Captain Indicator */}
                {match.player1.isCaptain && (
                  <div className="absolute -top-1 -right-1 bg-[#27D3C3] rounded-full w-4 h-4 flex items-center justify-center">
                    <Star className="w-3 h-3 text-black" />
                  </div>
                )}
                {match.player1.isViceCaptain && (
                  <div className="absolute -top-1 -right-1 bg-[#1fa8a0] rounded-full w-4 h-4 flex items-center justify-center">
                    <Star className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              
              <div className="ml-3">
                <div className="font-medium text-white">
                  {match.player1.name}
                  {match.player1.isInUserTeam && (
                    <Badge className="ml-2 bg-[#27D3C3]/30 text-[#27D3C3]">
                      Your Team
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {match.player1.country} • {match.player1.skillLevel}
                </div>
              </div>
            </div>
            
            <div className={`text-2xl font-bold ${isPlayerWinning(1) ? 'text-[#27D3C3]' : 'text-white'}`}>
              {match.player1Score}
            </div>
          </div>
          
          {/* Divider with match status */}
          <div className="flex items-center">
            <div className="flex-grow h-px bg-gray-700"></div>
            <div className="mx-2 text-xs text-gray-400 flex items-center">
              {isInProgress ? (
                <>
                  {isCloseMatch ? (
                    <Badge className="bg-red-600/30 text-red-300 font-normal">
                      <Flame className="h-3 w-3 mr-1" />
                      Close match! ({scoreDifference} point{scoreDifference !== 1 ? 's' : ''} difference)
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-700 text-gray-300 font-normal">
                      <Clock className="h-3 w-3 mr-1" />
                      {startTimeRelative}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge className="bg-gray-700 text-gray-300 font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  {match.status === "COMPLETED" || match.status === "completed" ? "Ended " : "Starts "} 
                  {startTimeRelative}
                </Badge>
              )}
            </div>
            <div className="flex-grow h-px bg-gray-700"></div>
          </div>
          
          {/* Player 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div 
                  className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold 
                    ${match.player2.isInUserTeam ? 'border-2 border-[#27D3C3]' : ''}
                  `}
                >
                  {match.player2.imageUrl 
                    ? <img src={match.player2.imageUrl} alt={match.player2.name} className="w-full h-full rounded-full object-cover" />
                    : match.player2.name.charAt(0)}
                </div>
                
                {/* Captain/Vice-Captain Indicator */}
                {match.player2.isCaptain && (
                  <div className="absolute -top-1 -right-1 bg-[#27D3C3] rounded-full w-4 h-4 flex items-center justify-center">
                    <Star className="w-3 h-3 text-black" />
                  </div>
                )}
                {match.player2.isViceCaptain && (
                  <div className="absolute -top-1 -right-1 bg-[#1fa8a0] rounded-full w-4 h-4 flex items-center justify-center">
                    <Star className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>
              
              <div className="ml-3">
                <div className="font-medium text-white">
                  {match.player2.name}
                  {match.player2.isInUserTeam && (
                    <Badge className="ml-2 bg-[#27D3C3]/30 text-[#27D3C3]">
                      Your Team
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {match.player2.country} • {match.player2.skillLevel}
                </div>
              </div>
            </div>
            
            <div className={`text-2xl font-bold ${isPlayerWinning(2) ? 'text-[#27D3C3]' : 'text-white'}`}>
              {match.player2Score}
            </div>
          </div>
        </>
      );
    } else if (match.teamA && match.teamB) {
      return (
        <>
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
                  {match.teamA.profileImage 
                    ? <img src={match.teamA.profileImage} alt={match.teamA.name} className="w-full h-full rounded-full object-cover" />
                    : match.teamA.name.charAt(0)}
                </div>
              </div>
              
              <div className="ml-3">
                <div className="font-medium text-white">
                  {match.teamA.name}
                </div>
              </div>
            </div>
            
            <div className={`text-2xl font-bold ${isPlayerWinning(1) ? 'text-[#27D3C3]' : 'text-white'}`}>
              {match.teamA.score}
            </div>
          </div>
          
          {/* Divider with match status */}
          <div className="flex items-center">
            <div className="flex-grow h-px bg-gray-700"></div>
            <div className="mx-2 text-xs text-gray-400 flex items-center">
              {isInProgress ? (
                <>
                  {isCloseMatch ? (
                    <Badge className="bg-red-600/30 text-red-300 font-normal">
                      <Flame className="h-3 w-3 mr-1" />
                      Close match! ({scoreDifference} point{scoreDifference !== 1 ? 's' : ''} difference)
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-700 text-gray-300 font-normal">
                      <Clock className="h-3 w-3 mr-1" />
                      {startTimeRelative}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge className="bg-gray-700 text-gray-300 font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  {match.status === "COMPLETED" || match.status === "completed" ? "Ended " : "Starts "} 
                  {startTimeRelative}
                </Badge>
              )}
            </div>
            <div className="flex-grow h-px bg-gray-700"></div>
          </div>
          
          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
                  {match.teamB.profileImage 
                    ? <img src={match.teamB.profileImage} alt={match.teamB.name} className="w-full h-full rounded-full object-cover" />
                    : match.teamB.name.charAt(0)}
                </div>
              </div>
              
              <div className="ml-3">
                <div className="font-medium text-white">
                  {match.teamB.name}
                </div>
              </div>
            </div>
            
            <div className={`text-2xl font-bold ${isPlayerWinning(2) ? 'text-[#27D3C3]' : 'text-white'}`}>
              {match.teamB.score}
            </div>
          </div>
        </>
      );
    }
    
    return (
      <div className="text-center py-4 text-gray-400">
        Match data unavailable
      </div>
    );
  };
  
  return (
    <Card className="bg-gray-800 border-gray-700 overflow-hidden">
      {/* Match Header: Tournament & Round Info */}
      <CardHeader className="py-3 px-4 bg-gray-800/80 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <div className="text-gray-400">{match.tournamentName}</div>
            <div className="font-medium text-white">{match.round}</div>
          </div>
          
          <div className="flex items-center space-x-2">
            {(match.courtNumber || match.court) && (
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                Court {match.courtNumber || match.court}
              </Badge>
            )}
            
            <Badge 
              className={
                isInProgress
                  ? "bg-green-600 text-white"
                  : isCompleted
                  ? "bg-gray-600 text-white"
                  : "bg-yellow-600 text-white"
              }
            >
              {isInProgress && <Flame className="h-3 w-3 mr-1" />}
              {match.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {/* Match Content: Players & Score */}
      <CardContent className="pt-4 pb-2 px-4">
        <div className="flex flex-col space-y-4">
          {renderMatch()}
        </div>
      </CardContent>
      
      {/* Match Footer: Ownership & Details Link */}
      <CardFooter className="py-3 px-4 border-t border-gray-700 bg-gray-800/50 flex justify-between items-center">
        <div className="text-sm text-gray-400 flex items-center">
          <Users className="h-3 w-3 mr-1" />
          {ownershipFormatted}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-[#27D3C3] hover:text-[#27D3C3]/80 hover:bg-[#27D3C3]/10 p-0 h-auto"
          onClick={() => onViewDetails && onViewDetails(match.id)}
        >
          Match Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
} 