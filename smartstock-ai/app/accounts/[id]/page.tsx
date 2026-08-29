"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { accountsClient } from "@/lib/api/accounts.client";
import { TransactionTable } from "@/components/accounts/transaction-table";
import { TransactionDetails } from "@/components/accounts/transaction-details";
import { Account } from "@/types/accounts/accounts.types";
import { ArrowLeft, Landmark, Wallet, Calendar, ShieldCheck, RefreshCw, ShieldAlert } from "lucide-react";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuth();
  const userRole = user?.role || "USER";
  const isAuthorized = ["ADMIN", "SALES", "ACCOUNTS", "MANAGER"].includes(userRole);

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for transaction details
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [isTxOpen, setIsTxOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch account properties
      const accResponse = await accountsClient.getAccountById(id);
      if (!accResponse.success || !accResponse.account) {
        setError("Account not found.");
        return;
      }
      setAccount(accResponse.account);

      // 2. Fetch payments (filtered by account_id)
      const txResponse = await accountsClient.getAccountTransactions(id);
      if (txResponse.success) {
        setTransactions(txResponse.payments);
      }
    } catch (err: any) {
      console.error("Account details loading error:", err);
      setError(
        err?.message || "An unexpected error occurred while loading account ledger."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [loadData, isAuthorized]);

  const handleBack = () => {
    router.push("/accounts");
  };

  const handleOpenTx = (tx: any) => {
    setSelectedTx(tx);
    setIsTxOpen(true);
  };

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
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  if (!isAuthorized) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto mt-16 select-none border border-border rounded-lg bg-surface/50">
              <ShieldAlert className="h-12 w-12 text-danger" />
              <h2 className="text-lg font-bold text-foreground mt-4">Permission Denied</h2>
              <p className="text-sm text-secondary-text mt-2">
                Your role ({userRole}) does not have permissions to access account ledgers.
              </p>
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          {/* Header */}
          <div className="flex items-center gap-4 select-none">
            <Button variant="outline" size="sm" onClick={handleBack} className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <PageHeader
              title={account ? account.name : "Account Details"}
              description="Financial statement and ledger details."
            />
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="ml-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Reload Ledger
            </Button>
          </div>

          {loading ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div className="h-28 bg-surface rounded-lg animate-pulse" />
                <div className="h-28 bg-surface rounded-lg animate-pulse" />
                <div className="h-28 bg-surface rounded-lg animate-pulse" />
              </div>
              <LoadingTable />
            </div>
          ) : error ? (
            <div className="mt-6">
              <ErrorState
                title="Account ledger load failed"
                message={error}
                onRetry={loadData}
              />
            </div>
          ) : account ? (
            <div className="mt-6 space-y-6">
              {/* Account Meta Cards */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3 select-none">
                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">
                      Current Ledger Balance
                    </span>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground font-mono mt-1.5">
                      {formatCurrency(account.balance)}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-secondary-text mt-4">
                    {account.type === "BANK" ? (
                      <Landmark className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Wallet className="h-3.5 w-3.5 text-warning" />
                    )}
                    <span>{account.type} Account Type</span>
                  </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">
                      Account Status
                    </span>
                    <div className="mt-2.5">
                      <StatusBadge status="ACTIVE" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-secondary-text mt-4">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Double-entry system compliant</span>
                  </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">
                      Account Registration
                    </span>
                    <p className="text-sm font-semibold text-foreground mt-2">
                      Registered on {formatDate(account.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-secondary-text mt-4">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Last audited: {formatDate(account.updated_at)}</span>
                  </div>
                </Card>
              </div>

              {/* Description Card */}
              {account.description && (
                <Card className="p-5 select-none border-border">
                  <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-sm font-bold">Account Notes / Description</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-secondary-text">{account.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Transaction ledger list */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-foreground select-none">Account Transaction Ledger</h3>
                <TransactionTable transactions={transactions} onViewDetails={handleOpenTx} />
              </div>
            </div>
          ) : null}

          {/* Details Dialog overlay */}
          <TransactionDetails
            isOpen={isTxOpen}
            onClose={() => setIsTxOpen(false)}
            transaction={selectedTx}
          />
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
