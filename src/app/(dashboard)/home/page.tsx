"use client";

import React from "react";
import LiveScoresCard from "@/components/home/LiveScoresCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { 
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight,
  BarChart,
  DollarSign 
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Welcome card */}
          <Card className="bg-gradient-to-r from-[#27D3C3]/10 to-[#27D3C3]/5 border-[#27D3C3]/20">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-2">Welcome to MatchUp!</h2>
              <p className="text-gray-400 mb-4">
                Your ultimate fantasy sports platform for pickleball.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Link href="/fantasy/contests">
                  <Button 
                    className="bg-[#27D3C3] hover:bg-[#27D3C3]/90 text-black"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Browse Contests
                  </Button>
                </Link>
                
                <Link href="/tournaments">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Tournaments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Contests</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Fantasy Teams</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tournaments</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          {/* Fantasy Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-[#27D3C3]" />
                Fantasy Performance
              </CardTitle>
              <CardDescription>
                Your performance across all fantasy contests
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-center p-12 border border-dashed border-gray-700 rounded-md">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">No performance data yet</p>
                  <p className="text-sm text-gray-500">
                    Join a fantasy contest to start tracking your performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Scores Card */}
          <LiveScoresCard />
          
          {/* Upcoming Tournaments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-[#27D3C3]" />
                Upcoming Tournaments
              </CardTitle>
              <CardDescription>
                Join tournaments and create teams
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300 font-medium">No upcoming tournaments</p>
                <p className="text-gray-400 text-sm mt-1">Check back later for new tournaments</p>
              </div>
            </CardContent>
            <div className="px-6 py-3 border-t border-gray-700">
              <Link href="/tournaments">
                <Button 
                  variant="outline" 
                  className="w-full text-[#27D3C3] hover:text-[#27D3C3]/90 border-[#27D3C3]/20 hover:bg-[#27D3C3]/10"
                >
                  View All Tournaments
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 