import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { Eye } from "lucide-react";

interface PaymentTransaction {
  id: string;
  sale_id: string | null;
  purchase_id: string | null;
  account_id: string;
  amount: number;
  payment_date: string | Date | null;
  payment_method: string;
  status: string;
  created_at: string | Date;
}

interface TransactionTableProps {
  transactions: PaymentTransaction[];
  onViewDetails: (tx: PaymentTransaction) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(val);
};

const formatDate = (dateStr: any) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

export const TransactionTable = ({ transactions, onViewDetails }: TransactionTableProps) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-lg bg-surface/50 text-center select-none">
        <p className="text-sm font-medium text-foreground">No transactions found.</p>
        <p className="text-xs text-secondary-text mt-1">No payment activity recorded for this account.</p>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Reference / Method</TableHeaderCell>
            <TableHeaderCell className="text-right text-success">Credit (Money In)</TableHeaderCell>
            <TableHeaderCell className="text-right text-danger">Debit (Money Out)</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => {
            const isOutflow = !!tx.purchase_id; // Paid to supplier
            const isInflow = !!tx.sale_id; // Paid by customer
            const dateToUse = tx.payment_date || tx.created_at;

            return (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs select-none">
                  {formatDate(dateToUse)}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isOutflow 
                      ? "bg-danger-very-light text-danger dark:bg-danger/10 border border-danger/20" 
                      : "bg-success-very-light text-success dark:bg-success/10 border border-success/20"
                  }`}>
                    {isOutflow ? "Supplier Payment" : isInflow ? "Customer Payment" : "System Adjustment"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-foreground font-semibold">
                    {tx.payment_method.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] text-secondary-text truncate max-w-[150px] font-mono select-none" title={tx.id}>
                    ID: {tx.id.slice(0, 8)}...
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-success">
                  {isInflow ? formatCurrency(tx.amount) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-danger">
                  {isOutflow ? formatCurrency(tx.amount) : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(tx)}
                    title="View Details"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
