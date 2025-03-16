// src/components/layout/MainLayout.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, Trophy, Calendar, Home, Menu, X, Gamepad2, Award, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const isAdmin = user?.role === "MASTER_ADMIN" || user?.role === "TOURNAMENT_ADMIN";
  const isReferee = user?.role === "REFEREE";

  // Different navigation items based on user role
  const playerNavItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Tournaments", href: "/tournaments", icon: <Trophy size={18} /> },
    { label: "Fantasy", href: "/fantasy/contests", icon: <Gamepad2 size={18} /> },
    { label: "Leaderboard", href: "/leaderboard", icon: <TrendingUp size={18} /> },
  ];

  const refereeNavItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Tournaments", href: "/tournaments", icon: <Trophy size={18} /> },
    { label: "My Matches", href: "/referee/matches", icon: <Award size={18} /> },
    { label: "Live Scoring", href: "/referee/live-scoring", icon: <Trophy size={18} /> },
  ];

  // Use player navigation by default
  const navItems = isReferee ? refereeNavItems : playerNavItems;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Redirect admins to their appropriate dashboard
  React.useEffect(() => {
    if (isAuthenticated && isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md bg-background/80 dark:bg-background/70 border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              PickleBall Fantasy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <ThemeToggle className="mr-2" />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.image || ""}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <Badge variant="outline" className="mt-1 py-0 text-xs">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {!isReferee && (
                    <DropdownMenuItem onClick={() => router.push("/fantasy/teams")}>
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>My Teams</span>
                    </DropdownMenuItem>
                  )}
                  {isReferee && (
                    <DropdownMenuItem onClick={() => router.push("/referee/matches")}>
                      <Award className="mr-2 h-4 w-4" />
                      <span>My Matches</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-2 pb-3 border-t px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center py-2 text-sm font-medium rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
            <div className="border-t pt-2 mt-2">
              <Link
                href="/profile"
                className="flex items-center py-2 text-sm font-medium rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={18} />
                <span className="ml-3">Profile</span>
              </Link>
              <Button
                variant="ghost"
                className="flex w-full items-center py-2 text-sm font-medium rounded-md hover:bg-muted justify-start p-0 h-auto"
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut size={18} />
                <span className="ml-3">Log Out</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-6 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} PickleBall Fantasy. All rights
                reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
