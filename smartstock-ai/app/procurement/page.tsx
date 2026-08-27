"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { suppliersClient } from "@/lib/api/suppliers.client";
import { purchasesClient } from "@/lib/api/purchases.client";
import { goodsReceiptsClient } from "@/lib/api/goods-receipts.client";
import { Supplier, Purchase, GoodsReceipt } from "@/types/procurement/procurement.types";
import {
  Plus,
  Truck,
  ShoppingBag,
  FileSpreadsheet,
  Users,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileCheck2,
} from "lucide-react";

export default function ProcurementOverviewPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppliersRes, purchasesRes, receiptsRes] = await Promise.all([
        suppliersClient.getSuppliers(),
        purchasesClient.getPurchases(),
        goodsReceiptsClient.getGoodsReceipts(),
      ]);

      if (suppliersRes.success && purchasesRes.success && receiptsRes.success) {
        setSuppliers(suppliersRes.suppliers);
        setPurchases(purchasesRes.purchases);
        setReceipts(receiptsRes.goodsReceipts);
      } else {
        setError("Failed to fetch procurement overview datasets.");
      }
    } catch (err: any) {
      console.error("Error loading procurement overview:", err);
      setError(
        err?.message || "An unexpected error occurred while loading overview dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Compute metrics
  const metrics = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.is_active).length;

    const draftPOs = purchases.filter((p) => p.status === "DRAFT").length;
    const submittedPOs = purchases.filter((p) => p.status === "SUBMITTED").length;
    const approvedPOs = purchases.filter((p) => p.status === "APPROVED").length;
    const partiallyReceivedPOs = purchases.filter((p) => p.status === "PARTIALLY_RECEIVED").length;
    const fullyReceivedPOs = purchases.filter((p) => p.status === "RECEIVED").length;
    
    const openPOs = approvedPOs + partiallyReceivedPOs;
    const pendingPOs = draftPOs + submittedPOs;

    const totalPOAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);

    return {
      totalSuppliers,
      activeSuppliers,
      openPOs,
      pendingPOs,
      partiallyReceivedPOs,
      fullyReceivedPOs,
      totalPOAmount,
    };
  }, [suppliers, purchases]);

  // Get recent 5 POs and GRNs
  const recentPOs = useMemo(() => {
    return [...purchases]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [purchases]);

  const recentReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [receipts]);

  // Supplier ID to Name map
  const supplierMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [suppliers]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="h-10 w-64 bg-surface border border-border rounded animate-pulse mb-6" />
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-surface border border-border rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-80 bg-surface border border-border rounded-lg animate-pulse" />
              <div className="h-80 bg-surface border border-border rounded-lg animate-pulse" />
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <ErrorState
              title="Overview metrics unavailable"
              message={error}
              onRetry={fetchOverviewData}
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
          <PageHeader
            title="Procurement Overview"
            description="High-level vendor performance KPIs, order tracking, and warehouse intake logs."
            actions={
              <div className="flex gap-2">
                <Link href="/suppliers" passHref>
                  <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-background">
                    Manage Suppliers
                  </Button>
                </Link>
                <Link href="/purchases/new" passHref>
                  <Button size="sm" className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Plus className="h-3.5 w-3.5" />
                    New Purchase Order
                  </Button>
                </Link>
              </div>
            }
          />

          {/* Quick Action Navigation Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            <Link href="/suppliers" className="block group">
              <Card className="p-4 bg-surface hover:bg-background border border-border rounded-lg transition-all flex flex-col justify-between h-28 hover:scale-[1.01] hover:border-primary-light/40">
                <div className="p-2 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg w-fit">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-foreground">Suppliers Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5 text-secondary-text group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>

            <Link href="/purchases" className="block group">
              <Card className="p-4 bg-surface hover:bg-background border border-border rounded-lg transition-all flex flex-col justify-between h-28 hover:scale-[1.01] hover:border-primary-light/40">
                <div className="p-2 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg w-fit">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-foreground">Purchase Orders</span>
                  <ArrowRight className="h-3.5 w-3.5 text-secondary-text group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>

            <Link href="/goods-receipts" className="block group">
              <Card className="p-4 bg-surface hover:bg-background border border-border rounded-lg transition-all flex flex-col justify-between h-28 hover:scale-[1.01] hover:border-primary-light/40">
                <div className="p-2 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg w-fit">
                  <Truck className="h-4.5 w-4.5" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-foreground">Goods Receipts</span>
                  <ArrowRight className="h-3.5 w-3.5 text-secondary-text group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>

            <Card className="p-4 bg-surface border border-border rounded-lg flex flex-col justify-between h-28">
              <div className="p-2 bg-success/10 text-success rounded-lg w-fit">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div className="mt-2 text-right">
                <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">Total Expenditures</span>
                <span className="text-sm font-bold text-foreground">${metrics.totalPOAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </Card>
          </div>

          {/* Detailed KPIs Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-6">
            <Card className="p-4 bg-surface border border-border rounded-lg text-center">
              <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Active Suppliers</p>
              <h4 className="text-xl font-extrabold text-foreground mt-1">{metrics.activeSuppliers}</h4>
              <p className="text-[9px] text-secondary-text mt-0.5">out of {metrics.totalSuppliers} total</p>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg text-center">
              <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Open Orders</p>
              <h4 className="text-xl font-extrabold text-primary mt-1">{metrics.openPOs}</h4>
              <p className="text-[9px] text-secondary-text mt-0.5">Approved & In Transit</p>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg text-center">
              <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Draft / Pending</p>
              <h4 className="text-xl font-extrabold text-warning mt-1">{metrics.pendingPOs}</h4>
              <p className="text-[9px] text-secondary-text mt-0.5">Needs Approval</p>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg text-center">
              <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Partially Received</p>
              <h4 className="text-xl font-extrabold text-primary-dark dark:text-primary mt-1">{metrics.partiallyReceivedPOs}</h4>
              <p className="text-[9px] text-secondary-text mt-0.5">Awaiting Backorders</p>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg text-center">
              <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Fully Received</p>
              <h4 className="text-xl font-extrabold text-success mt-1">{metrics.fullyReceivedPOs}</h4>
              <p className="text-[9px] text-secondary-text mt-0.5">Completed Intake</p>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Purchase Orders */}
            <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Recent Purchase Orders
                </h3>
                <Link href="/purchases" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-semibold">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentPOs.length === 0 ? (
                <div className="text-center py-12 text-xs text-secondary-text">
                  No purchase orders recorded yet.
                </div>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow hoverable={false}>
                        <TableHeaderCell>PO ID</TableHeaderCell>
                        <TableHeaderCell>Supplier</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell className="text-right">Total Amount</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPOs.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-semibold text-primary hover:underline">
                            <Link href={`/purchases/${po.id}`}>
                              {po.id.substring(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell className="text-foreground font-medium truncate max-w-[120px]">
                            {supplierMap[po.supplier_id] || "Loading supplier..."}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={po.status} />
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            ${po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>

            {/* Recent Goods Receipts */}
            <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Recent Goods Receipts
                </h3>
                <Link href="/goods-receipts" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-semibold">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentReceipts.length === 0 ? (
                <div className="text-center py-12 text-xs text-secondary-text">
                  No Goods Receipt Notes registered yet.
                </div>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow hoverable={false}>
                        <TableHeaderCell>GRN Number</TableHeaderCell>
                        <TableHeaderCell>PO ID</TableHeaderCell>
                        <TableHeaderCell>Receipt Date</TableHeaderCell>
                        <TableHeaderCell className="text-right">Status</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentReceipts.map((grn) => (
                        <TableRow key={grn.id}>
                          <TableCell className="font-semibold text-primary hover:underline">
                            <Link href={`/goods-receipts/${grn.id}`}>
                              {grn.id.substring(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell className="text-secondary-text">
                            {grn.purchase_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-secondary-text">
                            {new Date(grn.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <StatusBadge status={grn.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
