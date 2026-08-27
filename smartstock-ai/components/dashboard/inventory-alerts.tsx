import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { LowStockDetailItem } from "@/types/reports/reports.types";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryAlertsProps {
  alerts: LowStockDetailItem[];
}

export const InventoryAlerts = ({ alerts }: InventoryAlertsProps) => {
  const displayLimit = 5;
  const hasAlerts = alerts && alerts.length > 0;
  const displayedAlerts = hasAlerts ? alerts.slice(0, displayLimit) : [];

  if (!hasAlerts) {
    return (
      <Card className="h-[320px] flex flex-col justify-between">
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
          <CardDescription>Stock levels requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 border-t border-border bg-surface/50">
          <div className="p-2.5 rounded-full bg-success/10 text-success mb-3 flex items-center justify-center">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <p className="text-sm font-semibold text-foreground">No inventory alerts</p>
          <p className="text-xs text-secondary-text mt-1">All stock levels are above safety minimums.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col justify-between">
      <div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <span>Inventory Alerts</span>
            </CardTitle>
            {alerts.length > displayLimit && (
              <span className="text-[10px] font-bold bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">
                {alerts.length} total
              </span>
            )}
          </div>
          <CardDescription>Products currently below safety stock limits</CardDescription>
        </CardHeader>

        <CardContent className="p-0 border-t border-border mt-2">
          <TableContainer className="border-0 rounded-none max-h-[200px] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHead>
                <TableRow hoverable={false}>
                  <TableHeaderCell className="py-2">Product</TableHeaderCell>
                  <TableHeaderCell className="py-2 text-right">Stock / Min</TableHeaderCell>
                  <TableHeaderCell className="py-2 text-center">Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedAlerts.map((item) => {
                  const isOutOfStock = item.currentStock === 0;
                  const statusLabel = isOutOfStock ? "OUT_OF_STOCK" : "LOW_STOCK";

                  return (
                    <TableRow key={item.productId} className="h-10">
                      <TableCell className="py-1">
                        <div className="flex flex-col truncate max-w-[150px] sm:max-w-[200px]">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-secondary-text font-mono truncate">
                            {item.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1 text-right font-mono text-xs">
                        <span className={isOutOfStock ? "text-danger font-bold" : "text-foreground font-semibold"}>
                          {item.currentStock}
                        </span>
                        <span className="text-secondary-text"> / {item.minimumStock}</span>
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        <StatusBadge status={statusLabel} className="text-[10px] px-1.5 py-0" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </div>

      {alerts.length > displayLimit && (
        <div className="px-5 py-2 border-t border-border flex items-center justify-between bg-background/30 mt-auto">
          <span className="text-[10px] text-secondary-text font-medium">
            Showing {displayLimit} of {alerts.length} warnings
          </span>
          <Link href="/inventory" passHref legacyBehavior>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-semibold hover:text-primary-dark p-0 h-auto flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};
