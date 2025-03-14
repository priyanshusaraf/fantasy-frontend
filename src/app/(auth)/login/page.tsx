// app/login/page.tsx (example)
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already logged in
  if (status === "authenticated") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="login-container">
      <h1>Login to Your Account</h1>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="google-login-button"
      >
        {loading ? "Loading..." : "Sign in with Google"}
      </button>

      {/* Add other login methods here if needed */}
    </div>
  );
}
