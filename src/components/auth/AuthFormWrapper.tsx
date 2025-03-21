"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

interface AuthFormWrapperProps {
  children: ReactNode;
}

export function AuthFormWrapper({ children }: AuthFormWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
} 