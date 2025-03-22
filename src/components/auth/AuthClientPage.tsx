"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";

interface AuthClientPageProps {
  showRegisterForm: boolean;
  callbackUrl: string;
}

export default function AuthClientPage({ showRegisterForm, callbackUrl }: AuthClientPageProps) {
  // Log which form we're showing for debugging purposes
  useEffect(() => {
    console.log(`Auth page loaded, showing: ${showRegisterForm ? 'RegisterForm' : 'LoginForm'}`);
  }, [showRegisterForm]);
  
  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <AuthProvider>
          {showRegisterForm ? (
            <RegisterForm />
          ) : (
            <LoginForm callbackUrl={callbackUrl} />
          )}
        </AuthProvider>
      </div>
    </div>
  );
} 