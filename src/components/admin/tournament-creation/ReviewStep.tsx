"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { BadgeCheck, Calendar, Edit, MapPin, Medal, Users, X } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ReviewStep({ onEditSection }: { onEditSection: (section: string) => void }) {
  const { getValues } = useFormContext();
  const formValues = getValues();
  
  const basicDetails = formValues.basicDetails || {};
  const formatDetails = formValues.format || {};
  const playerDetails = formValues.players || {};
  const fantasyDetails = formValues.fantasy || {};
  
  // Helpers to format dates
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Not set";
    try {
      return format(new Date(date), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Count total players and teams
  const totalPlayers = (playerDetails.individuals || []).length;
  const totalTeams = (playerDetails.teams || []).length;
  
  // Check if there are any fantasy contests
  const hasFantasyContests = fantasyDetails.enableFantasy && (fantasyDetails.contests || []).length > 0;
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tournament Review</h2>
        <Badge variant="outline" className="text-base py-1 px-3">
          {basicDetails.status || "DRAFT"}
        </Badge>
      </div>
      
      <p className="text-muted-foreground">
        Review all details before finalizing the tournament. You can edit any section by clicking
        the Edit button.
      </p>
      
      {/* Basic Details Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Basic Details</h3>
              <p className="text-muted-foreground text-sm">Tournament fundamentals and schedule</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEditSection("basicDetails")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Tournament Name</h4>
                <p>{basicDetails.name || "Not set"}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Type</h4>
                <p>{basicDetails.type || "Not set"}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Entry Fee</h4>
                <p>{typeof basicDetails.entryFee === 'number' ? `₹${basicDetails.entryFee.toFixed(2)}` : "Free Entry"}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Max Participants</h4>
                <p>{basicDetails.maxParticipants || "Unlimited"}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="font-medium text-sm text-muted-foreground">Tournament Dates</h4>
              </div>
              <div className="pl-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Start Date:</span>
                  <span>{formatDate(basicDetails.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">End Date:</span>
                  <span>{formatDate(basicDetails.endDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Registration Opens:</span>
                  <span>{formatDate(basicDetails.registrationOpenDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Registration Closes:</span>
                  <span>{formatDate(basicDetails.registrationCloseDate)}</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h4 className="font-medium text-sm text-muted-foreground">Location</h4>
                </div>
                <p className="pl-6">{basicDetails.location || "Not specified"}</p>
              </div>
              
              <div>
                <div className="flex items-center">
                  <Medal className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h4 className="font-medium text-sm text-muted-foreground">Prize Money</h4>
                </div>
                <p className="pl-6">{basicDetails.prizeMoney ? `₹${basicDetails.prizeMoney.toFixed(2)}` : "Not specified"}</p>
              </div>
            </div>
          </div>
          
          {basicDetails.description && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
              <p className="whitespace-pre-line">{basicDetails.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tournament Format */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Tournament Format</h3>
              <p className="text-muted-foreground text-sm">Competition structure and rules</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEditSection("format")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Format Type</h4>
                <p>{formatDetails.formatType || "Not set"}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Match Format</h4>
                <p>{formatDetails.matchFormat ? formatMatchFormat(formatDetails.matchFormat) : "Not set"}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Scoring System</h4>
                <p>{formatDetails.scoringSystem ? formatScoringSystem(formatDetails.scoringSystem) : "Not set"}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {formatDetails.formatType === "KNOCKOUT" && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Number of Rounds</h4>
                  <p>{formatDetails.numberOfRounds || "Not set"}</p>
                </div>
              )}
              
              {(formatDetails.formatType === "ROUND_ROBIN" || formatDetails.formatType === "GROUPS_TO_KNOCKOUT") && (
                <>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Number of Groups</h4>
                    <p>{formatDetails.numberOfGroups || "Not set"}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Teams Per Group</h4>
                    <p>{formatDetails.teamsPerGroup || "Not set"}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Points System</h4>
                    <div className="flex justify-between text-sm">
                      <span>Win: {formatDetails.pointsForWin || 0}</span>
                      <span>Draw: {formatDetails.pointsForDraw || 0}</span>
                      <span>Loss: {formatDetails.pointsForLoss || 0}</span>
                    </div>
                  </div>
                </>
              )}
              
              {formatDetails.formatType === "GROUPS_TO_KNOCKOUT" && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Teams Advancing Per Group</h4>
                  <p>{formatDetails.teamsAdvancingPerGroup || "Not set"}</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {formatDetails.allowTies && (
                  <Badge variant="outline">Ties Allowed</Badge>
                )}
                {formatDetails.thirdPlaceMatch && (
                  <Badge variant="outline">3rd Place Match</Badge>
                )}
                {formatDetails.seedPlayers && (
                  <Badge variant="outline">Seeded Players</Badge>
                )}
              </div>
            </div>
          </div>
          
          {formatDetails.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Format Notes</h4>
              <p className="whitespace-pre-line">{formatDetails.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Players & Teams */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Players & Teams</h3>
              <p className="text-muted-foreground text-sm">Participants and registration settings</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEditSection("players")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Registration Mode</h4>
                <p>{playerDetails.registrationMode ? formatRegistrationMode(playerDetails.registrationMode) : "Admin Only"}</p>
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <h4 className="font-medium text-sm text-muted-foreground">Participant Summary</h4>
              </div>
              <div className="pl-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Individual Players:</span>
                  <span>{totalPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Teams:</span>
                  <span>{totalTeams}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {playerDetails.autoAssignPlayers && (
                  <Badge variant="outline">Auto-Assign Players</Badge>
                )}
                {playerDetails.allowPlayerSwitching && (
                  <Badge variant="outline">Player Switching Allowed</Badge>
                )}
              </div>
              
              {totalPlayers > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="players">
                    <AccordionTrigger>View Player List ({totalPlayers})</AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="space-y-1">
                          {(playerDetails.individuals || []).map((player, index) => (
                            <li key={player.id || index} className="text-sm flex items-center">
                              <span className="mr-2">•</span>
                              <span>{player.name}</span>
                              {player.isConfirmed && (
                                <BadgeCheck className="h-4 w-4 text-green-500 ml-2" />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
              
              {totalTeams > 0 && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="teams">
                    <AccordionTrigger>View Team List ({totalTeams})</AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="space-y-1">
                          {(playerDetails.teams || []).map((team, index) => (
                            <li key={team.id || index} className="text-sm">
                              <span className="font-medium">{team.name}</span>
                              <span className="text-muted-foreground ml-2">
                                ({team.players.length} players)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Fantasy Contests */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Fantasy Contests</h3>
              <p className="text-muted-foreground text-sm">Fantasy league setup and contests</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEditSection("fantasy")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          
          {fantasyDetails.enableFantasy ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">Enabled</Badge>
                {fantasyDetails.autoPublish && (
                  <Badge variant="outline">Auto-Publish</Badge>
                )}
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-sm text-muted-foreground">Points System</h4>
                <p>{fantasyDetails.fantasyPoints || "Standard"}</p>
              </div>
              
              {hasFantasyContests ? (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Contests ({(fantasyDetails.contests || []).length})</h4>
                  <div className="space-y-2">
                    {(fantasyDetails.contests || []).map((contest, index) => (
                      <div key={contest.id || index} className="border rounded-md p-3">
                        <div className="flex justify-between">
                          <h5 className="font-medium">{contest.name}</h5>
                          <Badge variant="outline">₹{contest.entryFee}</Badge>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>Prize Pool: ₹{contest.totalPrize}</span>
                          <span>Max Entries: {contest.maxEntries}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">No contests have been added yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                <X className="h-4 w-4 mr-1" />
                Disabled
              </Badge>
              <span className="text-muted-foreground">Fantasy contests are not enabled for this tournament.</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="border-t pt-6 flex justify-between">
        <Button variant="outline" onClick={() => onEditSection("fantasy")}>
          Back
        </Button>
        <div className="space-x-2">
          <Button variant="outline">Save as Draft</Button>
          <Button>Finalize Tournament</Button>
        </div>
      </div>
    </div>
  );
}

// Helper functions to format different values
function formatMatchFormat(format: string): string {
  const formats: Record<string, string> = {
    "BEST_OF_3": "Best of 3 Sets",
    "BEST_OF_5": "Best of 5 Sets",
    "SINGLE_SET": "Single Set",
    "TIME_BASED": "Time-based Match",
    "CUSTOM": "Custom Format"
  };
  return formats[format] || format;
}

function formatScoringSystem(system: string): string {
  const systems: Record<string, string> = {
    "TRADITIONAL": "Traditional (Games/Sets)",
    "RALLY_POINT": "Rally Point System",
    "CUSTOM": "Custom Scoring"
  };
  return systems[system] || system;
}

function formatRegistrationMode(mode: string): string {
  const modes: Record<string, string> = {
    "ADMIN_ONLY": "Admin Only",
    "INVITATION": "By Invitation",
    "OPEN": "Open Registration"
  };
  return modes[mode] || mode;
} 