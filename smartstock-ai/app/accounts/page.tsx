"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { accountsClient } from "@/lib/api/accounts.client";
import { AccountSummary } from "@/components/accounts/account-summary";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountForm } from "@/components/accounts/account-form";
import { Account } from "@/types/accounts/accounts.types";
import { Plus, RotateCw, ShieldAlert } from "lucide-react";

export default function AccountsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Type Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const userRole = user?.role || "USER";
  const isAuthorized = ["ADMIN", "SALES", "ACCOUNTS", "MANAGER"].includes(userRole);
  const canModify = ["ADMIN", "ACCOUNTS"].includes(userRole);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountsClient.getAccounts();
      if (response.success) {
        setAccounts(response.accounts);
      } else {
        setError("Failed to retrieve financial accounts.");
      }
    } catch (err: any) {
      console.error("Accounts load error:", err);
      setError(
        err?.message || "An unexpected error occurred while loading accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchAccounts();
    }
  }, [fetchAccounts, isAuthorized]);

  const handleOpenAdd = () => {
    setSelectedAccount(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const handleViewDetail = (id: string) => {
    router.push(`/accounts/${id}`);
  };

  // Filter accounts client-side for immediate responsive searches
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      (acc.description && acc.description.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === "ALL" || acc.type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (!isAuthorized) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto mt-16 select-none border border-border rounded-lg bg-surface/50">
              <ShieldAlert className="h-12 w-12 text-danger" />
              <h2 className="text-lg font-bold text-foreground mt-4">Permission Denied</h2>
              <p className="text-sm text-secondary-text mt-2">
                Your role ({userRole}) does not have permissions to access the financial accounts ledger.
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
            <PageHeader
              title="Accounts"
              description="Manage company accounts, balances and financial transactions."
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
                <RotateCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {canModify && (
                <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-6">
              <div className="h-28 bg-surface rounded-lg animate-pulse" />
              <LoadingTable />
            </div>
          ) : error ? (
            <div className="mt-6">
              <ErrorState
                title="Failed to load accounts"
                message={error}
                onRetry={fetchAccounts}
              />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Account summary cards */}
              <AccountSummary accounts={accounts} />

              {/* Action bar and Table filters */}
              <Card className="p-4 flex flex-col sm:flex-row items-center gap-4 bg-surface border-border select-none">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by account name or desc..."
                  className="w-full sm:max-w-xs"
                />
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-secondary-text shrink-0">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer w-full sm:w-auto font-medium"
                  >
                    <option value="ALL">All Types</option>
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="RECEIVABLE">RECEIVABLE</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>

                <div className="text-xs text-secondary-text sm:ml-auto">
                  Total Liquid Cash & Bank:{" "}
                  <span className="font-semibold text-foreground font-mono">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(
                      accounts
                        .filter((a) => ["CASH", "BANK"].includes(a.type))
                        .reduce((sum, a) => sum + a.balance, 0)
                    )}
                  </span>
                </div>
              </Card>

              {/* Accounts data table */}
              <AccountsTable
                accounts={filteredAccounts}
                onEdit={handleOpenEdit}
                onView={handleViewDetail}
                userRole={userRole}
              />
            </div>
          )}

          {/* Form Modal Dialog */}
          <AccountForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmitSuccess={fetchAccounts}
            account={selectedAccount}
          />
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
