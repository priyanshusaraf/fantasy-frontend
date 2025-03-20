"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function BasicLogin() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md mx-auto p-8 bg-gray-900 rounded-xl">
        <h1 className="text-3xl font-bold text-white text-center mb-6">MatchUp Fantasy</h1>
        
        <Button 
          onClick={handleLogin}
          disabled={loading}
          variant="default"
          className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          Sign In with Google
        </Button>
      </div>
    </div>
  );
} 