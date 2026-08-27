"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
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
import { goodsReceiptsClient } from "@/lib/api/goods-receipts.client";
import { GoodsReceipt } from "@/types/procurement/procurement.types";
import { Eye, Truck, CheckSquare, XCircle, BarChart3 } from "lucide-react";

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [poSearch, setPoSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await goodsReceiptsClient.getGoodsReceipts();
      if (response.success) {
        setReceipts(response.goodsReceipts);
      } else {
        setError("Failed to load goods receipts.");
      }
    } catch (err: any) {
      console.error("Error loading goods receipts:", err);
      setError(
        err?.message || "An unexpected error occurred while loading goods receipts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Filtering
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchPo =
        !poSearch.trim() ||
        r.purchase_id.toLowerCase().includes(poSearch.toLowerCase().trim());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "RECEIVED" && r.status === "RECEIVED") ||
        (statusFilter === "CANCELLED" && r.status === "CANCELLED");

      return matchPo && matchStatus;
    });
  }, [receipts, poSearch, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredReceipts.length;
    const completed = filteredReceipts.filter((r) => r.status === "RECEIVED").length;
    const cancelled = filteredReceipts.filter((r) => r.status === "CANCELLED").length;
    return { total, completed, cancelled };
  }, [filteredReceipts]);

  // Pagination Logic
  const totalItems = filteredReceipts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [poSearch, statusFilter]);

  const statusOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "RECEIVED", label: "Received" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Goods Receipts"
            description="View registered Goods Receipt Notes (GRN), carrier dispatches, and inventory updates."
          />

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total GRNs</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.total}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Completed Receipts</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.completed}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-danger/10 text-danger rounded-lg">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Cancelled Receipts</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.cancelled}</h3>
              </div>
            </Card>
          </div>

          {/* Filters Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="w-full sm:max-w-xs">
                <SearchInput
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  placeholder="Filter by Purchase Order ID..."
                  className="w-full"
                />
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
            <LoadingTable rows={5} cols={5} />
          ) : error ? (
            <ErrorState
              title="Unable to load Goods Receipts"
              message={error}
              onRetry={fetchReceipts}
            />
          ) : paginatedReceipts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No goods receipts found</p>
              {poSearch || statusFilter !== "ALL" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPoSearch("");
                    setStatusFilter("ALL");
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
                      <TableHeaderCell>GRN Number</TableHeaderCell>
                      <TableHeaderCell>Purchase Order</TableHeaderCell>
                      <TableHeaderCell>Carrier Details</TableHeaderCell>
                      <TableHeaderCell>Receipt Date</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedReceipts.map((grn) => (
                      <TableRow key={grn.id}>
                        <TableCell className="font-semibold text-foreground">
                          {grn.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-primary hover:underline font-semibold">
                          <Link href={`/purchases/${grn.purchase_id}`}>
                            {grn.purchase_id.substring(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className="text-secondary-text max-w-xs truncate">
                          {grn.carrier_details || "-"}
                        </TableCell>
                        <TableCell className="text-secondary-text">
                          {new Date(grn.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={grn.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Link href={`/goods-receipts/${grn.id}`} passHref>
                              <Button
                                variant="outline"
                                size="sm"
                                title="View GRN Details"
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
