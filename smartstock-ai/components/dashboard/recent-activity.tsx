import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { RecentActivityFeedItem } from "@/types/reports/reports.types";
import { ShoppingCart, CreditCard, ArrowUpDown, History } from "lucide-react";

interface RecentActivityProps {
  activity: RecentActivityFeedItem[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatActivityDate = (dateVal: string | Date) => {
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";

    const diffMs = new Date().getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export const RecentActivity = ({ activity }: RecentActivityProps) => {
  const hasActivity = activity && activity.length > 0;
  const displayedActivity = hasActivity ? activity.slice(0, 8) : []; // Show last 8 actions

  const getIcon = (type: string) => {
    switch (type) {
      case "sale":
        return (
          <div className="p-2 rounded-full bg-primary-very-light dark:bg-primary-light/10 text-primary flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4 w-4" />
          </div>
        );
      case "payment":
        return (
          <div className="p-2 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
        );
      case "stock_movement":
        return (
          <div className="p-2 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <ArrowUpDown className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-background text-secondary-text flex items-center justify-center shrink-0">
            <History className="h-4 w-4" />
          </div>
        );
    }
  };

  if (!hasActivity) {
    return (
      <Card className="h-[320px] flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Real-time log of business operations</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-5 pt-0 mt-2">
          <EmptyState
            title="No recent activity"
            description="No operations have been recorded in this time range."
            className="border-0 bg-transparent py-6 h-full flex flex-col items-center justify-center"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col justify-between">
      <div>
        <CardHeader className="pb-1">
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Real-time log of business operations</CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 border-t border-border mt-2">
          <div className="overflow-y-auto max-h-[250px] p-4 pt-2 space-y-3 scrollbar-thin">
            {displayedActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 py-1 border-b border-border/40 last:border-b-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getIcon(item.type)}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-normal truncate max-w-[180px] sm:max-w-[240px]">
                      {item.description}
                    </span>
                    <span className="text-[10px] text-secondary-text font-mono mt-0.5">
                      {formatActivityDate(item.date)}
                    </span>
                  </div>
                </div>

                {item.amount !== undefined && item.amount !== null && (
                  <span className="text-xs font-bold text-foreground font-mono shrink-0">
                    {formatCurrency(item.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
