"use client";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthProvider } from "@/context/AuthContext";

interface AuthClientPageProps {
  showRegisterForm: boolean;
  callbackUrl: string;
}

export default function AuthClientPage({ showRegisterForm, callbackUrl }: AuthClientPageProps) {
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