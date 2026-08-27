import React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { KpiCard } from "@/components/ui/card";
import { DashboardKPIs } from "@/types/reports/reports.types";
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  ArrowDownLeft,
} from "lucide-react";

interface KpiSectionProps {
  kpis: DashboardKPIs;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatNumber = (val: number) => {
  return new Intl.NumberFormat("en-IN").format(val);
};

export const KpiSection = ({ kpis }: KpiSectionProps) => {
  const { user } = useAuth();
  const role = user?.role || "ADMIN";

  const showSalesKpis = ["ADMIN", "MANAGER", "SALES", "ACCOUNTS"].includes(role);
  const showWarehouseKpis = ["ADMIN", "MANAGER", "WAREHOUSE"].includes(role);
  const showAccountsKpis = ["ADMIN", "MANAGER", "ACCOUNTS"].includes(role);

  const salesGrowth = kpis.salesGrowthPercentage;
  let growthChange: string | undefined;
  let growthChangeType: "increase" | "decrease" | "neutral" = "neutral";

  if (salesGrowth !== undefined && salesGrowth !== null) {
    if (salesGrowth > 0) {
      growthChange = `↑ ${salesGrowth.toFixed(1)}%`;
      growthChangeType = "increase";
    } else if (salesGrowth < 0) {
      growthChange = `↓ ${Math.abs(salesGrowth).toFixed(1)}%`;
      growthChangeType = "decrease";
    } else {
      growthChange = "0.0%";
      growthChangeType = "neutral";
    }
  }

  // Determine how many cards are visible
  let totalCards = 0;
  if (showSalesKpis) totalCards += 2;
  if (showWarehouseKpis) totalCards += 1;
  if (showAccountsKpis) totalCards += 1;

  const gridClass =
    totalCards === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : totalCards === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : totalCards === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1";

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {showSalesKpis && (
        <>
          <KpiCard
            title="Total Sales"
            value={formatCurrency(kpis.totalSales || 0)}
            change={growthChange}
            changeType={growthChangeType}
            description={growthChange ? "vs previous period" : undefined}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
          />
          <KpiCard
            title="Orders"
            value={formatNumber(kpis.orderCount || 0)}
            icon={<ShoppingBag className="h-4 w-4 text-primary" />}
          />
        </>
      )}

      {showWarehouseKpis && (
        <KpiCard
          title="Low Stock Alerts"
          value={formatNumber(kpis.lowStockAlertsCount || 0)}
          change={kpis.lowStockAlertsCount > 0 ? `${kpis.lowStockAlertsCount} items` : undefined}
          changeType={kpis.lowStockAlertsCount > 0 ? "decrease" : "increase"}
          description={kpis.lowStockAlertsCount > 0 ? "require attention" : "all good"}
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        />
      )}

      {showAccountsKpis && (
        <KpiCard
          title="Receivables"
          value={formatCurrency(kpis.receivablesAmount || 0)}
          icon={<ArrowDownLeft className="h-4 w-4 text-success" />}
        />
      )}
    </div>
  );
};
