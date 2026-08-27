import React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => {
  const { user } = useAuth();
  const role = user?.role || "ADMIN";

  const showSalesKpis = ["ADMIN", "MANAGER", "SALES", "ACCOUNTS"].includes(role);
  const showWarehouseKpis = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role);
  const showAccountsKpis = ["ADMIN", "MANAGER", "ACCOUNTS"].includes(role);
  const showChart = ["ADMIN", "MANAGER", "SALES", "ACCOUNTS"].includes(role);
  const showAlerts = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role);

  // Determine KPI count
  let kpiCount = 0;
  if (showSalesKpis) kpiCount += 2; // Sales, Orders
  if (showWarehouseKpis) kpiCount += 1; // Low stock alerts
  if (showAccountsKpis) kpiCount += 1; // Receivables (Note: ADMIN/MANAGER gets receivables too)

  return (
    <div className="space-y-6">
      {/* KPI Skeletons */}
      <div
        className={`grid gap-4 ${
          kpiCount === 4
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : kpiCount === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : kpiCount === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {Array.from({ length: kpiCount }).map((_, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between h-32">
            <div>
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-3 w-24 mt-4" />
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      {showChart && (
        <Card className="p-5 h-[350px] flex flex-col justify-between">
          <CardHeader className="p-0 pb-3">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="p-0 flex-1 flex items-end gap-3 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{
                  height: `${((i * 17) % 60) + 20}%`,
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lower grid skeletons */}
      <div
        className={`grid gap-6 ${
          showAlerts ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {showAlerts && (
          <Card className="p-5 h-[320px] flex flex-col justify-between">
            <CardHeader className="p-0 pb-3">
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="p-5 h-[320px] flex flex-col justify-between">
          <CardHeader className="p-0 pb-3">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col gap-3.5 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center py-2 border-b border-border/50">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
