"use client";

import React from "react";
import { useSession } from "next-auth/react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
            ? "bg-primary/10 text-primary hover:bg-primary/15"
            : "hover:bg-muted"
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Navigation items
  const navigationItems = [
    {
      href: "/admin/dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      label: "Dashboard",
    },
    {
      href: "/admin/user-management",
      icon: <Users className="h-4 w-4" />,
      label: "Users",
    },
    {
      href: "/admin/tournaments",
      icon: <Trophy className="h-4 w-4" />,
      label: "Tournaments",
    },
    {
      href: "/admin/player-management",
      icon: <User className="h-4 w-4" />,
      label: "Players",
    },
    {
      href: "/admin/schedule",
      icon: <CalendarDays className="h-4 w-4" />,
      label: "Schedule",
    },
    {
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
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
        <div className="flex h-16 items-center justify-center border-b border-border px-6">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">Admin Panel</span>
          </Link>
        </div>
        <div className="flex flex-col h-[calc(100%-64px)]">
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <div className="mb-2 px-3 py-1.5">
              <div className="font-medium text-sm">
                {session?.user?.name || "Admin User"}
              </div>
              <div className="text-xs text-muted-foreground">
                {session?.user?.email}
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => router.push("/api/auth/signout")}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
} 