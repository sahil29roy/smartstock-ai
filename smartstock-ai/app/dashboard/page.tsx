"use client";

import React, { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiSection } from "@/components/dashboard/kpi-card";
import { SalesOverview } from "@/components/dashboard/sales-overview";
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { dashboardClient } from "@/lib/dashboard.client";
import { DashboardSummaryResult } from "@/types/reports/reports.types";
import { AiSummary } from "@/components/ai/ai-summary";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<{ startDate?: string; endDate?: string }>({});

  const role = user?.role || "ADMIN";

  const showChart = ["ADMIN", "MANAGER", "SALES", "ACCOUNTS"].includes(role);
  const showAlerts = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role);

  const fetchDashboardData = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardClient.getDashboardSummary({
        startDate: start,
        endDate: end,
      });
      if (response.success) {
        setData(response.data);
      } else {
        setError("Failed to fetch dashboard overview data.");
      }
    } catch (err: unknown) {
      console.error("Dashboard page data load error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading dashboard statistics.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateChange = useCallback((start?: string, end?: string) => {
    setDates({ startDate: start, endDate: end });
    fetchDashboardData(start, end);
  }, [fetchDashboardData]);

  const handleRetry = () => {
    fetchDashboardData(dates.startDate, dates.endDate);
  };

  // Initial load on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <DashboardHeader onDateChange={handleDateChange} />

          {loading ? (
            <DashboardSkeleton />
          ) : error ? (
            <div className="mt-6">
              <ErrorState
                title="Unable to load dashboard data"
                message={error}
                onRetry={handleRetry}
              />
            </div>
          ) : data ? (
            <div className="mt-6 space-y-6">
              {/* KPI cards section */}
              <KpiSection kpis={data.kpis} />

              {/* AI Business Summary section */}
              {["ADMIN", "MANAGER"].includes(role) && <AiSummary />}

              {/* Sales Chart section */}
              {showChart && <SalesOverview salesTrend={data.salesTrend} />}

              {/* Alerts & Activities section */}
              <div
                className={`grid gap-6 ${
                  showAlerts ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {showAlerts && (
                  <InventoryAlerts alerts={data.lowStockAlerts} />
                )}

                <RecentActivity activity={data.recentActivity} />
              </div>
            </div>
          ) : null}
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
