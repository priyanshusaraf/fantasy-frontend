"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Button onClick={() => signIn("google")} className="px-6 py-3">
        Sign in with Google
      </Button>
    </div>
  );
}
