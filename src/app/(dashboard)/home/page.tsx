"use client";

import React from "react";
import LiveScoresCard from "@/components/home/LiveScoresCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { 
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight,
  BarChart,
  DollarSign,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Welcome card */}
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                Welcome to MatchUp!
              </h2>
              <p className="text-muted-foreground mb-6">
                Your ultimate fantasy sports platform for pickleball.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link href="/fantasy/contests">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Trophy className="h-4 w-4 mr-2" />
                    Browse Contests
                  </Button>
                </Link>
                
                <Link href="/tournaments">
                  <Button variant="outline" className="border-blue-200 dark:border-blue-800">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Tournaments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardDescription>Active Contests</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-blue-500" />
                  0
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardDescription>Fantasy Teams</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                  0
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardDescription>Tournaments</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  0
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          {/* Fantasy Performance */}
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                Fantasy Performance
              </CardTitle>
              <CardDescription>
                Your performance across all fantasy contests
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-center p-12 border border-dashed rounded-md">
                <div className="text-center">
                  <p className="text-foreground mb-2">No performance data yet</p>
                  <p className="text-sm text-muted-foreground">
                    Join a fantasy contest to start tracking your performance
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/fantasy/contests" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full text-blue-500 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Join a Contest
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Scores Card */}
          <LiveScoresCard />
          
          {/* Upcoming Tournaments */}
          <Card className="border-border hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                Upcoming Tournaments
              </CardTitle>
              <CardDescription>
                Join tournaments and create teams
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">No upcoming tournaments</p>
                <p className="text-muted-foreground text-sm mt-1">Check back later for new tournaments</p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/tournaments" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full text-blue-500 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  View All Tournaments
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 