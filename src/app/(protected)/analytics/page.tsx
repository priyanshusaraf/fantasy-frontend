// src/app/(protected)/analytics/page.tsx
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminGuard } from "@/components/auth/AdminGuard";
// import AnalyticsContent from "@/components/dashboard/AnalyticsContent";

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AdminGuard>{/* <AnalyticsContent /> */}hey</AdminGuard>
    </AuthGuard>
  );
}
