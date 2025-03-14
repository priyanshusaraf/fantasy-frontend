// src/components/layout/MainLayout.tsx
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, Trophy, Calendar, Home, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    {
      label: "Tournaments",
      href: "/tournaments",
      icon: <Calendar size={18} />,
    },
    { label: "Contests", href: "/contests", icon: <Trophy size={18} /> },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fb]">
      {/* Mobile navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-[#00a1e0]">
              PickelFantasy
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.profileImage || ""}
                        alt={user?.name || "User"}
                      />
                      <AvatarFallback>
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-teams">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>My Teams</span>
                    </Link>
                  </DropdownMenuItem>
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
                className="bg-[#00a1e0] hover:bg-[#0072a3]"
                onClick={() => router.push("/login")}
              >
                Sign In
              </Button>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:block border-t">
          <div className="container px-4">
            <nav className="flex items-center space-x-8 h-10">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-[#00a1e0] transition-colors"
                >
                  {item.icon}
                  <span className="ml-1">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 py-4">{children}</main>

      <footer className="py-6 border-t bg-white">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} PickelFantasy. All rights
                reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-[#00a1e0]"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-[#00a1e0]"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-500 hover:text-[#00a1e0]"
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
