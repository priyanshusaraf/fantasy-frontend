"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav>
      {session ? (
        <div>
          <span>Welcome, {session.user?.name}</span>
          <Button onClick={() => signOut()}>Logout</Button>
        </div>
      ) : (
        <Link href="/login">
          <Button asChild>
            <a>Login</a>
          </Button>
        </Link>
      )}
    </nav>
  );
}
