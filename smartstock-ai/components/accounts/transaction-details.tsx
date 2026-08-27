import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { Calendar, CreditCard, DollarSign, FileText, Hash, Link as LinkIcon, User } from "lucide-react";

interface PaymentTransaction {
  id: string;
  sale_id: string | null;
  purchase_id: string | null;
  account_id: string;
  amount: number;
  payment_date: string | Date | null;
  payment_method: string;
  status: string;
  created_by?: string | null;
  created_at: string | Date;
}

interface TransactionDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
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
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

export const TransactionDetails = ({ isOpen, onClose, transaction }: TransactionDetailsProps) => {
  if (!transaction) return null;

  const isOutflow = !!transaction.purchase_id;
  const dateToUse = transaction.payment_date || transaction.created_at;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Transaction Details" size="md">
      <div className="space-y-6 select-none">
        {/* Header Indicator */}
        <div className={`p-4 rounded-lg flex items-center justify-between border ${
          isOutflow 
            ? "bg-danger/10 border-danger/25 text-danger" 
            : "bg-success/10 border-success/25 text-success"
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
              {isOutflow ? "Money Out (Debit)" : "Money In (Credit)"}
            </span>
            <h4 className="text-xl font-bold font-mono mt-0.5">
              {isOutflow ? "-" : "+"}{formatCurrency(transaction.amount)}
            </h4>
          </div>
          <StatusBadge status={transaction.status} />
        </div>

        {/* Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2 border border-border bg-background p-4 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-text">
              <Hash className="h-3.5 w-3.5" />
              <span>Transaction ID</span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground break-all">{transaction.id}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-text">
              <Calendar className="h-3.5 w-3.5" />
              <span>Payment Date</span>
            </div>
            <p className="text-xs font-medium text-foreground">{formatDate(dateToUse)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-text">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payment Method</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {transaction.payment_method.replace(/_/g, " ")}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-text">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Related Entity</span>
            </div>
            {isOutflow ? (
              <div>
                <span className="text-xs text-secondary-text">Purchase Order:</span>
                <p className="text-xs font-mono font-bold text-primary break-all">{transaction.purchase_id}</p>
              </div>
            ) : (
              <div>
                <span className="text-xs text-secondary-text">Sales Order:</span>
                <p className="text-xs font-mono font-bold text-primary break-all">{transaction.sale_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
