"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { StatusBadge } from "@/components/common/status-badge";

export default function DashboardPlaceholder() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Dashboard Overview"
            description="Operational monitoring hub and system statistics."
          />

          <div className="mt-6 space-y-6">
            <Card className="bg-surface border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Welcome to SmartStock, {user?.name}!
                </CardTitle>
                <CardDescription className="text-xs">
                  Authentication established successfully.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-secondary-text">
                  <span className="font-semibold">Current Session Role:</span>
                  <StatusBadge status={user?.role || "USER"} />
                </div>
                <div className="p-4 bg-primary-very-light dark:bg-primary-light/5 border border-primary-light/20 rounded-lg text-xs leading-relaxed text-secondary-text">
                  <strong>Note:</strong> This dashboard is a temporary placeholder implemented for 
                  <strong> Phase 12 (Authentication & Session verification)</strong>. The full operational 
                  dashboard graphs, report summaries, and stats will be implemented in Phase 13.
                </div>
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
