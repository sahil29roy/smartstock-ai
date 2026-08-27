import React from "react";
import { TrendingUp, Package, DollarSign, Users } from "lucide-react";

export type ReportType = "sales" | "inventory" | "finance" | "customers";

interface ReportSelectorProps {
  activeTab: ReportType;
  onChange: (tab: ReportType) => void;
  userRole?: string;
}

export const ReportSelector = ({ activeTab, onChange, userRole }: ReportSelectorProps) => {
  const role = userRole || "USER";

  // RBAC filters for tabs:
  // - WAREHOUSE can only see inventory
  // - SALES can see sales, customers
  // - ACCOUNTS can see sales, finance
  // - ADMIN and MANAGER can see all
  const tabs = [
    {
      id: "sales" as ReportType,
      label: "Sales Analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      allowedRoles: ["ADMIN", "MANAGER", "SALES", "ACCOUNTS"],
    },
    {
      id: "inventory" as ReportType,
      label: "Inventory Assets",
      icon: <Package className="h-4 w-4" />,
      allowedRoles: ["ADMIN", "MANAGER", "WAREHOUSE"],
    },
    {
      id: "finance" as ReportType,
      label: "Financial Payments",
      icon: <DollarSign className="h-4 w-4" />,
      allowedRoles: ["ADMIN", "MANAGER", "ACCOUNTS"],
    },
    {
      id: "customers" as ReportType,
      label: "Customer Value",
      icon: <Users className="h-4 w-4" />,
      allowedRoles: ["ADMIN", "MANAGER", "SALES"],
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.allowedRoles.includes(role));

  return (
    <div className="flex border-b border-border bg-surface rounded-t-lg overflow-x-auto select-none no-scrollbar">
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? "border-primary text-primary bg-primary-very-light/10"
                : "border-transparent text-secondary-text hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
