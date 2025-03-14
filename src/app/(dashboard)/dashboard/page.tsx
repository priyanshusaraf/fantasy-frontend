"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Calendar, Trophy, Users } from "lucide-react";
import Link from "next/link";
// import { TournamentService } from "@/lib/tournament-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch active tournaments
        const tournamentsResponse = await fetch(
          "/api/tournaments?status=IN_PROGRESS,UPCOMING"
        );
        const tournamentsData = await tournamentsResponse.json();
        setTournaments(tournamentsData.tournaments || []);

        // Fetch upcoming contests
        const contestsResponse = await fetch(
          "/api/fantasy-pickleball/contests?status=UPCOMING"
        );
        const contestsData = await contestsResponse.json();
        setUpcomingContests(contestsData.contests || []);

        // If user is logged in, fetch their teams
        if (user) {
          const teamsResponse = await fetch(
            "/api/fantasy-pickleball/user/teams",
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const teamsData = await teamsResponse.json();
          setUserTeams(teamsData.teams || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-[#00a1e0]">
          Welcome, {user?.username}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center">
              <Calendar className="h-8 w-8 text-[#00a1e0] mr-4" />
              <div>
                <p className="text-sm text-gray-500">Active Tournaments</p>
                <p className="font-medium text-2xl">{tournaments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center">
              <Trophy className="h-8 w-8 text-[#00a1e0] mr-4" />
              <div>
                <p className="text-sm text-gray-500">Upcoming Contests</p>
                <p className="font-medium text-2xl">
                  {upcomingContests.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center">
              <Users className="h-8 w-8 text-[#00a1e0] mr-4" />
              <div>
                <p className="text-sm text-gray-500">Your Teams</p>
                <p className="font-medium text-2xl">{userTeams.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tournaments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
            <TabsTrigger value="contests">Fantasy Contests</TabsTrigger>
            {userTeams.length > 0 && (
              <TabsTrigger value="myteams">My Teams</TabsTrigger>
            )}
            {hasRole(["TOURNAMENT_ADMIN", "MASTER_ADMIN"]) && (
              <TabsTrigger value="admin">Admin</TabsTrigger>
            )}
            {hasRole("REFEREE") && (
              <TabsTrigger value="referee">Referee</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tournaments">
            <Card>
              <CardHeader>
                <CardTitle>Active Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading tournaments...</p>
                ) : tournaments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.slice(0, 6).map((tournament: any) => (
                      <Card key={tournament.id} className="overflow-hidden">
                        <div className="h-32 bg-gray-200">
                          {tournament.imageUrl ? (
                            <img
                              src={tournament.imageUrl}
                              alt={tournament.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gradient-to-r from-[#00a1e0] to-[#0b453a]">
                              <Trophy className="h-12 w-12 text-white" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-1">
                            {tournament.name}
                          </h3>
                          <p className="text-gray-500 text-sm mb-2">
                            {tournament.location}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                              {tournament.status}
                            </span>
                            <Link href={`/tournaments/${tournament.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No active tournaments found</p>
                )}

                {tournaments.length > 6 && (
                  <div className="text-center mt-4">
                    <Link href="/tournaments">
                      <Button variant="outline">See All Tournaments</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contests">
            <Card>
              <CardHeader>
                <CardTitle>Fantasy Contests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading contests...</p>
                ) : upcomingContests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingContests.slice(0, 6).map((contest: any) => (
                      <Card key={contest.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-1">
                            {contest.name}
                          </h3>
                          <p className="text-gray-500 text-sm mb-2">
                            {contest.tournament.name}
                          </p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">
                              {contest.entryFee > 0
                                ? `₹${contest.entryFee.toLocaleString()}`
                                : "Free Entry"}
                            </span>
                            <span className="text-sm font-medium">
                              Pool: ₹{contest.prizePool.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">
                              {contest.status}
                            </span>
                            <Link href={`/fantasy/contests/${contest.id}`}>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-[#00a1e0] hover:bg-[#0072a3]"
                              >
                                Join
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No upcoming contests found</p>
                )}

                {upcomingContests.length > 6 && (
                  <div className="text-center mt-4">
                    <Link href="/fantasy/contests">
                      <Button variant="outline">See All Contests</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userTeams.length > 0 && (
            <TabsContent value="myteams">
              <Card>
                <CardHeader>
                  <CardTitle>My Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userTeams.slice(0, 6).map((team: any) => (
                      <Card key={team.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-1">
                            {team.name}
                          </h3>
                          <p className="text-gray-500 text-sm mb-2">
                            {team.contest.name}
                          </p>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">
                              {team._count?.players || 0} Players
                            </span>
                            <span className="text-sm font-medium">
                              Points: {team.totalPoints || 0}
                            </span>
                          </div>
                          <div className="flex justify-end">
                            <Link href={`/fantasy/teams/${team.id}`}>
                              <Button variant="outline" size="sm">
                                View Team
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {userTeams.length > 6 && (
                    <div className="text-center mt-4">
                      <Link href="/my-teams">
                        <Button variant="outline">See All Teams</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasRole(["TOURNAMENT_ADMIN", "MASTER_ADMIN"]) && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Administration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4">
                          Create Tournament
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Set up a new tournament with fantasy contests.
                        </p>
                        <Link href="/admin/tournaments/create">
                          <Button className="bg-[#00a1e0] hover:bg-[#0072a3]">
                            Create Tournament
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4">
                          Manage Tournaments
                        </h3>
                        <p className="text-gray-500 mb-4">
                          View and manage your existing tournaments.
                        </p>
                        <Link href="/admin/tournaments">
                          <Button variant="outline">Manage Tournaments</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasRole("REFEREE") && (
            <TabsContent value="referee">
              <Card>
                <CardHeader>
                  <CardTitle>Referee Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4">Create Match</h3>
                        <p className="text-gray-500 mb-4">
                          Set up a new match and start scoring.
                        </p>
                        <Link href="/referee/create-match">
                          <Button className="bg-[#00a1e0] hover:bg-[#0072a3]">
                            Create Match
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-4">
                          Tournament Requests
                        </h3>
                        <p className="text-gray-500 mb-4">
                          View your tournament join requests.
                        </p>
                        <Link href="/referee/tournaments">
                          <Button variant="outline">View Requests</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AuthGuard>
  );
}
