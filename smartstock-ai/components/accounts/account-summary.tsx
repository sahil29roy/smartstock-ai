import React from "react";
import { KpiCard } from "@/components/ui/card";
import { Account } from "@/types/accounts/accounts.types";
import { Wallet, Landmark, ShieldCheck, DollarSign } from "lucide-react";

interface AccountSummaryProps {
  accounts: Account[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export const AccountSummary = ({ accounts }: AccountSummaryProps) => {
  const totalAccounts = accounts.length;
  
  const cashAccounts = accounts.filter(a => a.type === "CASH");
  const bankAccounts = accounts.filter(a => a.type === "BANK");

  const cashBalance = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
  const bankBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBalance = cashBalance + bankBalance;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Total Balance"
        value={formatCurrency(totalBalance)}
        description="Available Liquid Funds"
        icon={<DollarSign className="h-4 w-4 text-primary" />}
      />
      <KpiCard
        title="Cash Balance"
        value={formatCurrency(cashBalance)}
        description={`${cashAccounts.length} Cash Accounts`}
        icon={<Wallet className="h-4 w-4 text-warning" />}
      />
      <KpiCard
        title="Bank Balance"
        value={formatCurrency(bankBalance)}
        description={`${bankAccounts.length} Bank Accounts`}
        icon={<Landmark className="h-4 w-4 text-success" />}
      />
      <KpiCard
        title="Total Accounts"
        value={totalAccounts}
        description="Registered in Ledger"
        icon={<ShieldCheck className="h-4 w-4 text-info" />}
      />
    </div>
  );
};
