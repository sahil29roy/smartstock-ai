import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import { ReportSummary } from "./report-summary";
import { StatusBadge } from "@/components/common/status-badge";
import { InventoryReportResult } from "@/types/reports/reports.types";
import { Package, Landmark, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface InventoryReportProps {
  data: InventoryReportResult;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateStr: any) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

export const InventoryReport = ({ data }: InventoryReportProps) => {
  if (!data || !data.lowStockDetails || !Array.isArray(data.lowStockDetails)) {
    return null;
  }
  const summaryCards = [
    {
      title: "Stock Valuation",
      value: formatCurrency(data.totalValue),
      icon: <Landmark className="h-4 w-4 text-success" />,
      description: "Aggregated cost value of physical inventory",
    },
    {
      title: "Unique Products",
      value: data.uniqueProductsCount,
      icon: <Package className="h-4 w-4 text-primary" />,
      description: "Count of product catalog SKUs",
    },
    {
      title: "Low Stock Items",
      value: data.lowStockItemsCount,
      icon: <AlertTriangle className="h-4 w-4 text-warning" />,
      description: "Items running below threshold",
      className: data.lowStockItemsCount > 0 ? "border-warning/25 bg-warning/5" : undefined,
    },
    {
      title: "Out of Stock Items",
      value: data.outOfStockItemsCount,
      icon: <XCircle className="h-4 w-4 text-danger" />,
      description: "Items with zero physical units",
      className: data.outOfStockItemsCount > 0 ? "border-danger/25 bg-danger/5" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Summary cards */}
      <ReportSummary cards={summaryCards} />

      {/* Low Stock details */}
      <Card className="border-border select-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Low Stock & Out of Stock Alerts</CardTitle>
          <CardDescription>Items requiring reorder or immediate replenishment</CardDescription>
        </CardHeader>
        <CardContent>
          {data.lowStockDetails.length === 0 ? (
            <div className="text-center p-8 text-sm text-secondary-text border border-dashed border-border rounded-lg bg-surface/50">
              All inventory levels are currently sufficient.
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow hoverable={false}>
                    <TableHeaderCell>Product</TableHeaderCell>
                    <TableHeaderCell>SKU</TableHeaderCell>
                    <TableHeaderCell className="text-right">Current Stock</TableHeaderCell>
                    <TableHeaderCell className="text-right">Min Threshold</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.lowStockDetails.map((item) => {
                    const isOut = item.currentStock <= 0;
                    return (
                      <TableRow key={item.productId}>
                        <TableCell className="font-semibold text-foreground">{item.productName}</TableCell>
                        <TableCell className="font-mono text-xs text-secondary-text">{item.sku}</TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isOut ? "text-danger" : "text-warning"}`}>
                          {item.currentStock}
                        </TableCell>
                        <TableCell className="text-right font-mono text-secondary-text">{item.minimumStock}</TableCell>
                        <TableCell>
                          <StatusBadge status={isOut ? "OUT_OF_STOCK" : "LOW_STOCK"} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent movements history */}
      <Card className="border-border select-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Recent Stock Movements</CardTitle>
          <CardDescription>Log of stock level adjustments, sales releases, and goods receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentMovements.length === 0 ? (
            <div className="text-center p-8 text-sm text-secondary-text border border-dashed border-border rounded-lg bg-surface/50">
              No stock movements recorded.
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow hoverable={false}>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Product</TableHeaderCell>
                    <TableHeaderCell>Movement Type</TableHeaderCell>
                    <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
                    <TableHeaderCell>Adjustment Reason</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentMovements.map((m) => {
                    const isInflow = m.type === "IN" || (m.type === "ADJUSTMENT" && m.quantity > 0);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs text-secondary-text select-none">
                          {formatDate(m.createdAt)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div>
                            <div className="text-foreground">{m.productName}</div>
                            <div className="text-[10px] text-secondary-text font-mono">SKU: {m.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isInflow 
                              ? "bg-success-very-light text-success dark:bg-success/10 border border-success/20" 
                              : "bg-danger-very-light text-danger dark:bg-danger/10 border border-danger/20"
                          }`}>
                            {isInflow ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {m.type}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isInflow ? "text-success" : "text-danger"}`}>
                          {isInflow ? "+" : "-"}{Math.abs(m.quantity)}
                        </TableCell>
                        <TableCell className="text-xs text-secondary-text max-w-[200px] truncate">
                          {m.reason || "System Transaction"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
