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
import { FinancialReportResult } from "@/types/reports/reports.types";
import { DollarSign, ArrowDownLeft, Landmark, CreditCard } from "lucide-react";

interface FinanceReportProps {
  data: FinancialReportResult;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const FinanceReport = ({ data }: FinanceReportProps) => {
  const activeBalance = data.accountBalances.reduce((sum, a) => sum + a.balance, 0);

  const summaryCards = [
    {
      title: "Total Revenue Collected",
      value: formatCurrency(data.totalRevenue),
      icon: <DollarSign className="h-4 w-4 text-success" />,
      description: "Gross payment cash inflows",
    },
    {
      title: "Outstanding Receivables",
      value: formatCurrency(data.totalReceivables),
      icon: <ArrowDownLeft className="h-4 w-4 text-danger" />,
      description: "Pending buyer collections",
      className: data.totalReceivables > 0 ? "border-danger/25 bg-danger/5" : undefined,
    },
    {
      title: "Combined Ledger Value",
      value: formatCurrency(activeBalance),
      icon: <Landmark className="h-4 w-4 text-primary" />,
      description: "Net balances in CASH/BANK accounts",
    },
    {
      title: "Active Accounts Count",
      value: data.accountBalances.length,
      icon: <CreditCard className="h-4 w-4 text-info" />,
      description: "Number of listed accounts",
    },
  ];

  // SVG Bar Chart dimensions for Payment Method Breakdown
  const svgWidth = 600;
  const svgHeight = 200;
  const paddingLeft = 100;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 20;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxAmount = Math.max(...data.paymentsMethodSummary.map((d) => d.totalAmount), 1000);
  const rowHeight = data.paymentsMethodSummary.length > 0 
    ? chartHeight / data.paymentsMethodSummary.length 
    : 40;

  return (
    <div className="space-y-6">
      {/* Metrics Summary cards */}
      <ReportSummary cards={summaryCards} />

      {/* SVG Bar Chart for Payment methods */}
      <Card className="border-border select-none">
        <CardHeader>
          <CardTitle>Cash Flow by Payment Method</CardTitle>
          <CardDescription>Payment collections split by method type</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px]">
          {data.paymentsMethodSummary.length === 0 ? (
            <div className="text-center p-8 text-sm text-secondary-text">
              No payments recorded for this period.
            </div>
          ) : (
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full text-foreground select-none">
              {data.paymentsMethodSummary.map((item, idx) => {
                const y = paddingTop + idx * rowHeight + (rowHeight - 20) / 2;
                const barWidth = (item.totalAmount / maxAmount) * chartWidth;
                
                return (
                  <g key={item.paymentMethod}>
                    {/* Method Label */}
                    <text
                      x={paddingLeft - 10}
                      y={y + 14}
                      textAnchor="end"
                      className="text-xs font-semibold fill-secondary-text"
                    >
                      {item.paymentMethod.replace(/_/g, " ")}
                    </text>

                    {/* Bar Background Track */}
                    <rect
                      x={paddingLeft}
                      y={y}
                      width={chartWidth}
                      height={20}
                      rx={3}
                      className="fill-background stroke-none"
                    />

                    {/* Filled Bar */}
                    <rect
                      x={paddingLeft}
                      y={y}
                      width={Math.max(barWidth, 4)}
                      height={20}
                      rx={3}
                      className="fill-primary stroke-none"
                    />

                    {/* Amount value label */}
                    <text
                      x={paddingLeft + Math.max(barWidth, 4) + 8}
                      y={y + 14}
                      className="text-xs font-mono font-bold fill-foreground"
                    >
                      {formatCurrency(item.totalAmount)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </CardContent>
      </Card>

      {/* Account Balances Table */}
      <Card className="border-border select-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Ledger Balance Statement</CardTitle>
          <CardDescription>Individual balances mapped by system financial accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {data.accountBalances.length === 0 ? (
            <div className="text-center p-8 text-sm text-secondary-text border border-dashed border-border rounded-lg bg-surface/50">
              No financial accounts listed.
            </div>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow hoverable={false}>
                    <TableHeaderCell>Account Name</TableHeaderCell>
                    <TableHeaderCell>Account Type</TableHeaderCell>
                    <TableHeaderCell className="text-right">Ledger Balance</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.accountBalances.map((item) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="font-semibold text-foreground">{item.accountName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-background border border-border text-foreground tracking-wide">
                          {item.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatCurrency(item.balance)}
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
