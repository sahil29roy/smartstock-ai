"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { ReportSelector, ReportType } from "@/components/reports/report-selector";
import { ReportFilters, FilterParams } from "@/components/reports/report-filters";
import { SalesReport } from "@/components/reports/sales-report";
import { InventoryReport } from "@/components/reports/inventory-report";
import { FinanceReport } from "@/components/reports/finance-report";
import { CustomerReport } from "@/components/reports/customer-report";
import { reportsClient } from "@/lib/api/reports.client";
import { ShieldAlert } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const userRole = user?.role || "USER";

  // Determine starting tab based on RBAC roles
  const getInitialTab = (role: string): ReportType => {
    if (role === "WAREHOUSE") return "inventory";
    if (role === "ACCOUNTS") return "finance";
    return "sales"; // ADMIN, MANAGER, SALES default to sales
  };

  const [activeTab, setActiveTab] = useState<ReportType>("sales");
  const [filters, setFilters] = useState<FilterParams>({});
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set initial tab once user is loaded
  useEffect(() => {
    if (user?.role) {
      setActiveTab(getInitialTab(user.role));
    }
  }, [user]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (activeTab) {
        case "sales":
          response = await reportsClient.getSalesReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
            categoryId: filters.categoryId,
            productId: filters.productId,
          });
          break;
        case "inventory":
          response = await reportsClient.getInventoryReport({
            categoryId: filters.categoryId,
          });
          break;
        case "finance":
          response = await reportsClient.getFinancialReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          break;
        case "customers":
          response = await reportsClient.getCustomerReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
          break;
        default:
          throw new Error("Invalid report tab selection");
      }

      if (response.success) {
        setData(response.data);
      } else {
        setError("Failed to compile report analysis.");
      }
    } catch (err: any) {
      console.error("Report loading error:", err);
      setError(
        err?.message || "An unexpected error occurred while loading reports."
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    if (user?.role) {
      loadReport();
    }
  }, [loadReport, user]);

  const handleApplyFilters = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setFilters({}); // Clear filters on tab switch for safety
  };

  // RBAC checks for page views
  const isAuthorized = ["ADMIN", "MANAGER", "SALES", "WAREHOUSE", "ACCOUNTS"].includes(userRole);

  if (!isAuthorized) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto mt-16 select-none border border-border rounded-lg bg-surface/50">
              <ShieldAlert className="h-12 w-12 text-danger" />
              <h2 className="text-lg font-bold text-foreground mt-4">Permission Denied</h2>
              <p className="text-sm text-secondary-text mt-2">
                Your role ({userRole}) does not have permission to view system reporting analytics.
              </p>
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          {/* Header */}
          <PageHeader
            title="Reports & Analytics"
            description="Analyze sales, inventory, cash flows and customer performance."
          />

          <div className="mt-6 space-y-6">
            {/* Tab selector */}
            <ReportSelector
              activeTab={activeTab}
              onChange={handleTabChange}
              userRole={userRole}
            />

            {/* Filter controls (Inventory doesn't require date filters, but sales/finance/customers do) */}
            <ReportFilters
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              showCategoryProduct={activeTab === "sales" || activeTab === "inventory"}
            />

            {/* Main content display area */}
            {loading ? (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                  <div className="h-28 bg-surface rounded-lg animate-pulse" />
                  <div className="h-28 bg-surface rounded-lg animate-pulse" />
                  <div className="h-28 bg-surface rounded-lg animate-pulse" />
                  <div className="h-28 bg-surface rounded-lg animate-pulse" />
                </div>
                <LoadingTable />
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to load report analytics"
                message={error}
                onRetry={loadReport}
              />
            ) : data ? (
              <div className="animate-fade-in">
                {activeTab === "sales" && <SalesReport data={data} />}
                {activeTab === "inventory" && <InventoryReport data={data} />}
                {activeTab === "finance" && <FinanceReport data={data} />}
                {activeTab === "customers" && <CustomerReport data={data} />}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-border rounded-lg bg-surface/50 select-none text-secondary-text text-sm">
                No report data available for the selected period.
              </div>
            )}
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
