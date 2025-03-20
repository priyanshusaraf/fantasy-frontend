import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-gray-900 flex items-center justify-center">
      {children}
    </main>
  );
} 