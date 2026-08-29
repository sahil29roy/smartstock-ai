"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { SalesHeader } from "@/components/sales/sales-header";
import { SaleSummary } from "@/components/sales/sale-summary";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesTable } from "@/components/sales/sales-table";
import { LoadingTable, LoadingCards } from "@/components/feedback/loading-state";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { salesClient } from "@/lib/api/sales.client";
import { customersClient } from "@/lib/api/customers.client";
import { Sale } from "@/types/sales/sales.types";
import { Customer } from "@/types/customer/customer.types";
import { ShoppingBag } from "lucide-react";

export default function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Allowed roles check
  const isAuthorized = React.useMemo(() => {
    if (authLoading) return true;
    return ["ADMIN", "SALES", "ACCOUNTS", "MANAGER"].includes(user?.role || "");
  }, [user, authLoading]);

  const fetchSalesData = useCallback(async (isRefresh = false) => {
    if (!isAuthorized) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Fetch Customers
      const custResp = await customersClient.getCustomers(false);
      if (custResp.success) {
        setCustomers(custResp.customers);
      }

      // 2. Fetch Sales (backend allows status and customer filters)
      const salesFilters: { customerId?: string; status?: string } = {};
      if (selectedCustomerId) {
        salesFilters.customerId = selectedCustomerId;
      }
      if (selectedStatus !== "ALL") {
        salesFilters.status = selectedStatus;
      }

      const salesResp = await salesClient.getSales(salesFilters);
      if (salesResp.success) {
        setSales(salesResp.sales);
      }
    } catch (err: any) {
      console.error("Failed to fetch sales data:", err);
      setError(err.message || "Failed to load sales orders. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCustomerId, selectedStatus, isAuthorized]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCustomerId, selectedStatus]);

  // Filter sales on client-side search (by Sale ID or Customer Name)
  const filteredSales = React.useMemo(() => {
    return sales.filter((sale) => {
      // Search by ID
      const matchesId = sale.id.toLowerCase().includes(search.toLowerCase().trim());
      
      // Search by Customer Name
      const customer = customers.find((c) => c.id === sale.customer_id);
      const matchesCustomer = customer
        ? customer.name.toLowerCase().includes(search.toLowerCase().trim())
        : false;

      return matchesId || matchesCustomer;
    });
  }, [sales, search, customers]);

  // Paginate filtered sales
  const paginatedSales = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

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
          <SalesHeader userRole={user?.role} />

          {error ? (
            <ErrorState
              title="Error Loading Sales"
              message={error}
              onRetry={() => fetchSalesData()}
            />
          ) : loading ? (
            <div className="space-y-6">
              <LoadingCards count={4} />
              <LoadingTable rows={5} cols={6} />
            </div>
          ) : (
            <>
              <SaleSummary sales={sales} />
              
              <SalesFilters
                search={search}
                onSearchChange={setSearch}
                selectedCustomerId={selectedCustomerId}
                onCustomerChange={setSelectedCustomerId}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                customers={customers}
                onRefresh={() => fetchSalesData(true)}
                refreshing={refreshing}
              />

              {filteredSales.length === 0 ? (
                <EmptyState
                  title="No Sales Orders Found"
                  description={
                    search || selectedCustomerId || selectedStatus !== "ALL"
                      ? "Try adjusting your search terms or filters to locate the order."
                      : "Create your first sales order to start tracking revenue and fulfillment."
                  }
                  icon={<ShoppingBag className="h-8 w-8 text-secondary-text" />}
                />
              ) : (
                <SalesTable
                  sales={paginatedSales}
                  customers={customers}
                  userRole={user?.role}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredSales.length}
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
