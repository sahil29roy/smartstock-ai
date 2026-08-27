"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { purchasesClient } from "@/lib/api/purchases.client";
import { suppliersClient } from "@/lib/api/suppliers.client";
import { Purchase, Supplier } from "@/types/procurement/procurement.types";
import { Plus, Eye, ShoppingBag, DollarSign, Clock, CheckCircle } from "lucide-react";

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSupplierId, setSelectedSupplierId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userRole = user?.role;
  const canCreate = ["ADMIN", "ACCOUNTS"].includes(userRole || "");

  // Load data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [purchasesRes, suppliersRes] = await Promise.all([
        purchasesClient.getPurchases(),
        suppliersClient.getSuppliers(),
      ]);

      if (purchasesRes.success) {
        setPurchases(purchasesRes.purchases);
      } else {
        setError("Failed to load purchase orders.");
      }

      if (suppliersRes.success) {
        setSuppliers(suppliersRes.suppliers);
      }
    } catch (err: any) {
      console.error("Error loading purchases data:", err);
      setError(
        err?.message || "An unexpected error occurred while loading purchase orders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create mapping of supplier IDs to Names
  const supplierMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [suppliers]);

  // Client-side/Server-side hybrid filtering
  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      const matchSupplier =
        selectedSupplierId === "ALL" || po.supplier_id === selectedSupplierId;

      const matchStatus =
        selectedStatus === "ALL" || po.status === selectedStatus;

      return matchSupplier && matchStatus;
    });
  }, [purchases, selectedSupplierId, selectedStatus]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredPurchases.length;
    const totalValue = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0);
    const pending = filteredPurchases.filter((p) => p.status === "DRAFT" || p.status === "SUBMITTED").length;
    const open = filteredPurchases.filter((p) => p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED").length;
    return { total, totalValue, pending, open };
  }, [filteredPurchases]);

  // Pagination Logic
  const totalItems = filteredPurchases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSupplierId, selectedStatus]);

  // Populate supplier select options
  const supplierOptions = useMemo(() => {
    const opts = [{ value: "ALL", label: "All Suppliers" }];
    suppliers.forEach((s) => {
      opts.push({ value: s.id, label: s.name });
    });
    return opts;
  }, [suppliers]);

  const statusOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "APPROVED", label: "Approved" },
    { value: "PARTIALLY_RECEIVED", label: "Partially Received" },
    { value: "RECEIVED", label: "Received" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Purchase Orders"
            description="Generate and monitor supplier orders, track fulfillment states, and record costs."
            actions={
              canCreate ? (
                <Link href="/purchases/new" passHref>
                  <Button className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]">
                    <Plus className="h-4 w-4" />
                    New Purchase Order
                  </Button>
                </Link>
              ) : null
            }
          />

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Orders</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.total}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Cost Value</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  {loading
                    ? "..."
                    : `$${kpis.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-warning/10 text-warning rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Draft / Pending</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.pending}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary-dark dark:text-primary rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Approved / Open</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.open}</h3>
              </div>
            </Card>
          </div>

          {/* Filters Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="w-full sm:max-w-xs">
                <Select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full"
                >
                  {supplierOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingTable rows={5} cols={6} />
          ) : error ? (
            <ErrorState
              title="Unable to load purchases"
              message={error}
              onRetry={fetchData}
            />
          ) : paginatedPurchases.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No purchase orders found</p>
              {selectedSupplierId !== "ALL" || selectedStatus !== "ALL" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSupplierId("ALL");
                    setSelectedStatus("ALL");
                  }}
                  className="text-primary mt-2"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Order ID</TableHeaderCell>
                      <TableHeaderCell>Supplier</TableHeaderCell>
                      <TableHeaderCell>Order Date</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Total Amount</TableHeaderCell>
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPurchases.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-semibold text-foreground">
                          {po.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {supplierMap[po.supplier_id] || "Loading supplier..."}
                        </TableCell>
                        <TableCell className="text-secondary-text">
                          {new Date(po.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={po.status} />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          ${po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Link href={`/purchases/${po.id}`} passHref>
                              <Button
                                variant="outline"
                                size="sm"
                                title="View Details"
                                className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </TableContainer>
            </>
          )}
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
