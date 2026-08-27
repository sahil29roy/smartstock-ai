"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { ChallanHeader } from "@/components/challans/challan-header";
import { ChallanSummary } from "@/components/challans/challan-summary";
import { ChallanFilters } from "@/components/challans/challan-filters";
import { ChallanTable } from "@/components/challans/challan-table";
import { LoadingTable, LoadingCards } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { challansClient } from "@/lib/api/challans.client";
import { Challan } from "@/types/sales/sales.types";
import { Truck } from "lucide-react";

export default function ChallansPage() {
  const { user, loading: authLoading } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Allowed roles check
  const isAuthorized = React.useMemo(() => {
    if (authLoading) return true;
    return ["ADMIN", "WAREHOUSE", "SALES", "MANAGER"].includes(user?.role || "");
  }, [user, authLoading]);

  const fetchChallansData = useCallback(async (isRefresh = false) => {
    if (!isAuthorized) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const filters: { status?: any } = {};
      if (selectedStatus !== "ALL") {
        filters.status = selectedStatus;
      }

      const response = await challansClient.getChallans(filters);
      if (response.success) {
        setChallans(response.challans);
      }
    } catch (err: any) {
      console.error("Failed to load challans list:", err);
      setError(err.message || "Failed to load delivery challans. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, isAuthorized]);

  useEffect(() => {
    fetchChallansData();
  }, [fetchChallansData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  // Filter challans in memory by search term (challan number or sale ID)
  const filteredChallans = React.useMemo(() => {
    return challans.filter((ch) => {
      const matchesNumber = ch.challan_number.toLowerCase().includes(search.toLowerCase().trim());
      const matchesSaleId = ch.sale_id.toLowerCase().includes(search.toLowerCase().trim());
      return matchesNumber || matchesSaleId;
    });
  }, [challans, search]);

  // Paginated dispatches
  const paginatedChallans = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredChallans.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredChallans, currentPage]);

  const totalPages = Math.ceil(filteredChallans.length / itemsPerPage);

  if (!authLoading && !isAuthorized) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <ErrorState
              title="Access Denied"
              message="You don't have permission to perform this action."
            />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <ChallanHeader />

          {error ? (
            <ErrorState
              title="Error Loading Challans"
              message={error}
              onRetry={() => fetchChallansData()}
            />
          ) : loading ? (
            <div className="space-y-6">
              <LoadingCards count={4} />
              <LoadingTable rows={5} cols={6} />
            </div>
          ) : (
            <>
              <ChallanSummary challans={challans} />

              <ChallanFilters
                search={search}
                onSearchChange={setSearch}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                onRefresh={() => fetchChallansData(true)}
                refreshing={refreshing}
              />

              {filteredChallans.length === 0 ? (
                <EmptyState
                  title="No Delivery Challans Found"
                  description={
                    search || selectedStatus !== "ALL"
                      ? "Adjust filters or search parameters to locate the challan."
                      : "Create delivery challans directly from a confirmed Sales Order."
                  }
                  icon={<Truck className="h-8 w-8 text-secondary-text" />}
                />
              ) : (
                <ChallanTable
                  challans={paginatedChallans}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredChallans.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
