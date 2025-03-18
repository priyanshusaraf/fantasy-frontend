"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/Button";
import { 
  Award, 
  Calendar, 
  Home, 
  User, 
  Trophy, 
  Gamepad2, 
  Menu, 
  X,
  Bell,
  LogOut,
  Clock
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserAccountMenu from "./UserAccountMenu";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md bg-background/80 dark:bg-background/70 border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                PickleBall Fantasy
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/" passHref>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/tournaments" passHref>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Tournaments</span>
              </Button>
            </Link>
            <Link href="/fantasy/team" passHref>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Gamepad2 className="h-4 w-4" />
                <span>Fantasy</span>
              </Button>
            </Link>
            <Link href="/fantasy/live-scores" passHref>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Live Scores</span>
              </Button>
            </Link>
            <Link href="/leaderboard" passHref>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                <span>Leaderboard</span>
              </Button>
            </Link>
            <Link href="/referee/live-scoring/123" passHref>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                <Badge variant="outline" className="h-5 px-1.5 text-xs font-semibold bg-red-500/10 text-red-500 border-red-200 dark:border-red-800">LIVE</Badge>
                <span>Scoring</span>
              </Button>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle - Make it visible for all users */}
            <ThemeToggle className="mr-2" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-auto">
                  <DropdownMenuItem className="flex flex-col items-start py-2">
                    <div className="font-medium text-sm">New tournament added</div>
                    <div className="text-xs text-muted-foreground mt-1">Summer Pickleball Championship is now open for registration.</div>
                    <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start py-2">
                    <div className="font-medium text-sm">Your team scored points</div>
                    <div className="text-xs text-muted-foreground mt-1">Your fantasy team gained 45 points from recent matches.</div>
                    <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start py-2">
                    <div className="font-medium text-sm">New contest available</div>
                    <div className="text-xs text-muted-foreground mt-1">A new Pro League fantasy contest is open for entries.</div>
                    <div className="text-xs text-muted-foreground mt-1">Yesterday</div>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary font-medium">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Account Menu - imported as component */}
            <UserAccountMenu />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t mt-3 space-y-1">
            <Link href="/" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Home className="h-4 w-4 mr-2" />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/tournaments" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Tournaments</span>
              </Button>
            </Link>
            <Link href="/fantasy/team" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Gamepad2 className="h-4 w-4 mr-2" />
                <span>Fantasy</span>
              </Button>
            </Link>
            <Link href="/fantasy/live-scores" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                <span>Live Scores</span>
              </Button>
            </Link>
            <Link href="/leaderboard" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                <span>Leaderboard</span>
              </Button>
            </Link>
            <Link href="/referee/live-scoring/123" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Badge variant="outline" className="mr-2 h-5 px-1.5 text-xs font-semibold bg-red-500/10 text-red-500 border-red-200 dark:border-red-800">LIVE</Badge>
                <span>Scoring</span>
              </Button>
            </Link>
            <Link href="/profile" passHref>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                <span>Profile</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
