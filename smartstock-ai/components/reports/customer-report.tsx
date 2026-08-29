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
import { CustomerReportResult } from "@/types/reports/reports.types";
import { Users, DollarSign, Award, AlertCircle } from "lucide-react";

interface CustomerReportProps {
  data: CustomerReportResult;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateStr: any) => {
  if (!dateStr) return "Never";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export const CustomerReport = ({ data }: CustomerReportProps) => {
  const totalCustomers = data.length;
  
  // Sort by revenue to find top spender
  const sortedBySales = [...data].sort((a, b) => b.totalSales - a.totalSales);
  const topCustomer = sortedBySales[0]?.customerName || "N/A";
  
  const totalSales = data.reduce((sum, c) => sum + c.totalSales, 0);
  const totalPending = data.reduce((sum, c) => sum + c.totalPending, 0);

  const summaryCards = [
    {
      title: "Active Customers",
      value: totalCustomers,
      icon: <Users className="h-4 w-4 text-primary" />,
      description: "Customers with orders on record",
    },
    {
      title: "Top Customer Spender",
      value: topCustomer,
      icon: <Award className="h-4 w-4 text-warning" />,
      description: "Highest revenue contributor",
    },
    {
      title: "Total Customer Sales",
      value: formatCurrency(totalSales),
      icon: <DollarSign className="h-4 w-4 text-success" />,
      description: "Combined customer order value",
    },
    {
      title: "Total Outstanding",
      value: formatCurrency(totalPending),
      icon: <AlertCircle className="h-4 w-4 text-danger" />,
      description: "Pending receivables outstanding",
      className: totalPending > 0 ? "border-danger/25 bg-danger/5" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Summary cards */}
      <ReportSummary cards={summaryCards} />

      {/* Customer performance table */}
      <Card className="border-border select-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Customer Lifetime Value (LTV) Ledger</CardTitle>
          <CardDescription>Ranked list of customers by purchases, revenue, and outstanding balances</CardDescription>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center p-8 text-sm text-secondary-text border border-dashed border-border rounded-lg bg-surface/50">
              No customer performance records found.
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow hoverable={false}>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell className="text-right">Orders</TableHeaderCell>
                    <TableHeaderCell className="text-right">Total Sales</TableHeaderCell>
                    <TableHeaderCell className="text-right">Paid Amount</TableHeaderCell>
                    <TableHeaderCell className="text-right">Outstanding</TableHeaderCell>
                    <TableHeaderCell>Last Purchase</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedBySales.map((item) => (
                    <TableRow key={item.customerId}>
                      <TableCell className="font-semibold">
                        <div>
                          <div className="text-foreground">{item.customerName}</div>
                          {item.phone && (
                            <div className="text-[10px] text-secondary-text font-mono">Ph: {item.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">{item.salesCount}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatCurrency(item.totalSales)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-success">
                        {formatCurrency(item.totalPaid)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${item.totalPending > 0 ? "text-danger" : "text-secondary-text"}`}>
                        {formatCurrency(item.totalPending)}
                      </TableCell>
                      <TableCell className="text-xs text-secondary-text">
                        {formatDate(item.lastPurchaseDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
