"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  Settings,
  CreditCard,
  HelpCircle,
  Moon,
  Sun,
  Bell,
  Trophy,
  Users,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function UserAccountMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Theme hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Successfully signed out");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };
  
  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) return null;
  
  // Don't show theme toggle for master admin
  const showThemeToggle = session?.user?.role !== "MASTER_ADMIN";
  
  // Get user-specific menu items based on role
  const getRoleSpecificItems = () => {
    const role = session?.user?.role;
    
    switch (role) {
      case "MASTER_ADMIN":
      case "TOURNAMENT_ADMIN":
        return (
          <DropdownMenuItem 
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        );
      case "REFEREE":
        return (
          <DropdownMenuItem 
            onClick={() => router.push("/referee/dashboard")}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Referee Dashboard</span>
          </DropdownMenuItem>
        );
      case "PLAYER":
        return (
          <DropdownMenuItem 
            onClick={() => router.push("/player/statistics")}
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            <span>My Statistics</span>
          </DropdownMenuItem>
        );
      default:
        return null;
    }
  };
  
  // Get profile link based on user role
  const getProfileLink = () => {
    const role = session?.user?.role;
    
    switch (role) {
      case "MASTER_ADMIN":
      case "TOURNAMENT_ADMIN":
        return "/admin/profile";
      case "REFEREE":
        return "/referee/profile";
      case "PLAYER":
        return "/player/profile";
      default:
        return "/profile";
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarImage 
              src={session?.user?.image || undefined} 
              alt={session?.user?.name || "User"} 
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {session?.user?.name ? getInitials(session.user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground leading-none mt-1">
              {session?.user?.email || ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(getProfileLink())}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push("/account/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push("/account/billing")}
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => router.push("/notifications")}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
          
          {getRoleSpecificItems()}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {showThemeToggle && (
          <>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem
          onClick={() => router.push("/help")}
          className="flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 