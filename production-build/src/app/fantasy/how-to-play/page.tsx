import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HowToPlayPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          How to Play Fantasy Pickleball
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Learn how to create your fantasy team, score points, and compete in contests.
        </p>
      </div>

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">The Basics</TabsTrigger>
          <TabsTrigger value="scoring">Scoring System</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="strategies">Winning Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Fantasy Pickleball</CardTitle>
              <CardDescription>
                Learn the fundamentals of fantasy pickleball
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">What is Fantasy Pickleball?</h3>
                <p>
                  Fantasy Pickleball allows you to build a team of real pickleball players competing in tournaments. 
                  Your fantasy team earns points based on the real-life performance of your selected players. 
                  Compete against other fantasy managers to see who can assemble the highest-scoring team!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">How to Create a Team</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Browse available contests from the Fantasy Contests page</li>
                  <li>Select a contest you wish to join</li>
                  <li>Pay the entry fee (if applicable)</li>
                  <li>Draft players to your team within the salary cap constraints</li>
                  <li>Submit your team before the contest deadline</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Understanding Salary Caps</h3>
                <p>
                  Each player has an assigned salary value based on their skill and past performance. 
                  Your team must fit within the total salary cap for the contest. 
                  This creates a strategic balance where you can't simply select all the top players.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring">
          <Card>
            <CardHeader>
              <CardTitle>Scoring System</CardTitle>
              <CardDescription>
                How players earn points for your fantasy team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Point Allocations</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Win a match</td>
                        <td className="px-4 py-3 whitespace-nowrap">+10</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Win a game</td>
                        <td className="px-4 py-3 whitespace-nowrap">+3</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Score a point</td>
                        <td className="px-4 py-3 whitespace-nowrap">+0.5</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Ace serve</td>
                        <td className="px-4 py-3 whitespace-nowrap">+2</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Winner shot</td>
                        <td className="px-4 py-3 whitespace-nowrap">+1</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Double fault</td>
                        <td className="px-4 py-3 whitespace-nowrap">-1</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap">Unforced error</td>
                        <td className="px-4 py-3 whitespace-nowrap">-0.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Bonus Points</h3>
                <p>
                  Additional bonus points can be earned for:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tournament champion: +25 points</li>
                  <li>Tournament runner-up: +15 points</li>
                  <li>Reaching semifinals: +10 points</li>
                  <li>Perfect game (11-0): +5 points</li>
                  <li>Comeback win (down by 5+ points): +8 points</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contests">
          <Card>
            <CardHeader>
              <CardTitle>Contest Types</CardTitle>
              <CardDescription>
                Different ways to compete in fantasy pickleball
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tournament Contests</h3>
                <p>
                  Tournament contests are tied to specific real-world pickleball tournaments. Your fantasy team 
                  consists of players competing in that tournament, and the contest runs for the duration of the 
                  tournament.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Contest Formats</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Guaranteed Prize Pools (GPP)</h4>
                    <p>
                      These contests have a fixed prize pool regardless of the number of entries. 
                      Prizes are distributed among top finishers according to a predetermined structure.
                    </p>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">50/50s</h4>
                    <p>
                      In these contests, approximately half of the entrants win a prize. 
                      The prize is typically the same for all winners.
                    </p>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Head-to-Head</h4>
                    <p>
                      Compete directly against another player, with the higher-scoring team taking the entire prize.
                    </p>
                  </div>
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Free Contests</h4>
                    <p>
                      Practice contests with no entry fee. These are great for beginners to learn the game without risking money.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle>Winning Strategies</CardTitle>
              <CardDescription>
                Tips to help you build successful fantasy pickleball teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Research Is Key</h3>
                <p>
                  Stay informed about player performance, recent form, injuries, and matchups. 
                  Players who have been performing well recently are more likely to continue that form.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Value Hunting</h3>
                <p>
                  Look for underpriced players who provide good value. These might be emerging talents 
                  or established players who have been overlooked. Getting value from your lower-priced 
                  selections allows you to afford premium players elsewhere.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Diversify Your Teams</h3>
                <p>
                  If entering multiple contests, consider diversifying your team selections. This spreads your 
                  risk and increases your chances of catching a breakout performance from an unexpected player.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Consider the Bracket</h3>
                <p>
                  Look at the tournament bracket and consider a player's path. Players with a favorable draw 
                  are more likely to advance further, giving them more opportunities to score points for your team.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Stay Engaged</h3>
                <p>
                  In contests that allow roster changes between rounds, stay active and make adjustments 
                  based on performance, injuries, or matchup changes. Being proactive can give you an edge.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 