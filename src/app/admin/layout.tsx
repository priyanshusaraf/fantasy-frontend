"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  Users,
  Trophy,
  Settings,
  User,
  LogOut,
  List,
  CalendarDays,
  PieChart,
  Menu,
  X,
  Home,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href} passHref>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start",
          isActive
            ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/15"
            : "hover:bg-accent/10"
        )}
      >
        <div className="flex items-center">
          <div className="mr-2">{icon}</div>
          <span>{label}</span>
        </div>
      </Button>
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Check if user is an admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      !["MASTER_ADMIN", "TOURNAMENT_ADMIN"].includes(
        session?.user?.role as string
      )
    ) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // If still checking authentication, show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  const isMasterAdmin = session?.user?.role === "MASTER_ADMIN";
  const isTournamentAdmin = session?.user?.role === "TOURNAMENT_ADMIN";

  // Generate user's initials for the avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Navigation items - some are only visible to specific admin types
  const navigationItems = [
    {
      href: "/admin/dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Dashboard",
      showTo: ["MASTER_ADMIN", "TOURNAMENT_ADMIN"],
    },
    {
      href: "/admin/user-approvals",
      icon: <Users className="h-4 w-4" />,
      label: "User Approvals",
      showTo: ["MASTER_ADMIN"],
    },
    {
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      label: "User Management",
      showTo: ["MASTER_ADMIN"],
    },
    {
      href: "/admin/tournaments",
      icon: <Trophy className="h-4 w-4" />,
      label: "Tournaments",
      showTo: ["MASTER_ADMIN", "TOURNAMENT_ADMIN"],
    },
    {
      href: "/admin/player-management",
      icon: <User className="h-4 w-4" />,
      label: "Players",
      showTo: ["MASTER_ADMIN", "TOURNAMENT_ADMIN"],
    },
    {
      href: "/admin/schedule",
      icon: <CalendarDays className="h-4 w-4" />,
      label: "Schedule",
      showTo: ["MASTER_ADMIN", "TOURNAMENT_ADMIN"],
    },
    {
      href: "/admin/analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Analytics",
      showTo: ["MASTER_ADMIN"],
    },
    {
      href: "/admin/system",
      icon: <Settings className="h-4 w-4" />,
      label: "System",
      showTo: ["MASTER_ADMIN"],
    },
    {
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      showTo: ["MASTER_ADMIN", "TOURNAMENT_ADMIN"],
    },
  ];
  
  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => 
    item.showTo.includes(session?.user?.role as string)
  );

  // Handle logout
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-blue-200 dark:border-blue-800"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">
              {isMasterAdmin ? "Master Admin" : "Admin Panel"}
            </span>
          </Link>
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col h-[calc(100%-64px)]">
          <div className="p-3">
            <Badge className={cn(
              "w-full justify-center py-1.5",
              isMasterAdmin ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            )}>
              {isMasterAdmin ? "MASTER ADMIN" : "TOURNAMENT ADMIN"}
            </Badge>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-custom">
            {filteredNavigationItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
            
            <div className="pt-4">
              <Link href="/" passHref>
                <Button
                  variant="outline"
                  className="w-full justify-start border-blue-200 dark:border-blue-800"
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="p-3 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{session?.user?.name}</span>
                      <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
      
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 