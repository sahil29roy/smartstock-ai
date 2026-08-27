"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
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
import { goodsReceiptsClient } from "@/lib/api/goods-receipts.client";
import { purchasesClient } from "@/lib/api/purchases.client";
import { productsClient } from "@/lib/products.client";
import { GoodsReceipt, GoodsReceiptItem, Purchase } from "@/types/procurement/procurement.types";
import { Product } from "@/types/product/product.types";
import { ArrowLeft, Truck, AlertTriangle, Calendar, Clock, Undo2 } from "lucide-react";

export default function GoodsReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuth();
  const userRole = user?.role;

  const [goodsReceipt, setGoodsReceipt] = useState<(GoodsReceipt & { items: GoodsReceiptItem[] }) | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal state
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const fetchReceiptDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [receiptRes, productsRes] = await Promise.all([
        goodsReceiptsClient.getGoodsReceiptById(id),
        productsClient.getProducts(),
      ]);

      if (receiptRes.success) {
        setGoodsReceipt(receiptRes.goodsReceipt);
        
        // Fetch PO details
        const purchaseRes = await purchasesClient.getPurchaseById(receiptRes.goodsReceipt.purchase_id);
        if (purchaseRes.success) {
          setPurchase(purchaseRes.purchase);
        }
      } else {
        setError("Goods receipt not found.");
      }

      if (productsRes.success) {
        setProducts(productsRes.products);
      }
    } catch (err: any) {
      console.error("Error loading goods receipt details:", err);
      setError(
        err?.message || "An unexpected error occurred while loading details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReceiptDetails();
    }
  }, [id, fetchReceiptDetails]);

  // Product mapping
  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  // Submit Cancellation
  const handleCancelSubmit = async () => {
    setCancelSubmitting(true);
    setCancelError(null);

    try {
      const response = await goodsReceiptsClient.cancelGoodsReceipt(id);
      if (response.success) {
        setIsCancelOpen(false);
        fetchReceiptDetails();
      } else {
        setCancelError("Failed to cancel goods receipt.");
      }
    } catch (err: any) {
      console.error("Error cancelling goods receipt:", err);
      setCancelError(err?.message || "An unexpected error occurred during cancellation.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const showCancelBtn = goodsReceipt?.status === "RECEIVED" && ["ADMIN", "WAREHOUSE"].includes(userRole || "");

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="h-6 w-24 bg-surface border border-border rounded animate-pulse mb-6" />
            <div className="h-12 w-64 bg-surface border border-border rounded animate-pulse mb-6" />
            <LoadingTable rows={4} cols={4} />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !goodsReceipt) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/goods-receipts")}
                className="flex items-center gap-1.5 text-xs border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Goods Receipts
              </Button>
            </div>
            <ErrorState
              title="Receipt not found"
              message={error || "Goods receipt sheet details unavailable."}
              onRetry={fetchReceiptDetails}
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
          <div className="mb-6">
            <Link href="/goods-receipts" passHref>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground hover:bg-background border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Goods Receipts
              </Button>
            </Link>
          </div>

          <PageHeader
            title={`Goods Receipt: ${goodsReceipt.id.substring(0, 8)}...`}
            description="Inspect ingested quantities and trace stock movement details."
            actions={
              <div className="flex items-center gap-3">
                {showCancelBtn && (
                  <Button
                    onClick={() => setIsCancelOpen(true)}
                    className="bg-danger hover:bg-danger/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Cancel Receipt
                  </Button>
                )}
                <StatusBadge status={goodsReceipt.status} />
              </div>
            }
          />

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Header Summary */}
            <div className="md:col-span-1 space-y-4">
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Reference Info</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-secondary-text block">Associated Purchase Order</span>
                    {purchase ? (
                      <Link href={`/purchases/${purchase.id}`} className="text-primary hover:underline font-bold">
                        {purchase.id.substring(0, 8)}...
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">Loading PO...</span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-border">
                    <span className="font-semibold text-secondary-text block">Carrier & Dispatch Details</span>
                    <p className="text-foreground font-medium whitespace-pre-wrap mt-0.5">
                      {goodsReceipt.carrier_details || "No carrier details specified"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">System Audit</h3>

                <div className="flex items-center gap-3 text-xs">
                  <Calendar className="h-4 w-4 text-secondary-text" />
                  <div>
                    <p className="font-bold text-secondary-text">Receipt Registered</p>
                    <p className="text-foreground font-medium">{new Date(goodsReceipt.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <Clock className="h-4 w-4 text-secondary-text" />
                  <div>
                    <p className="font-bold text-secondary-text">Last Updated</p>
                    <p className="text-foreground font-medium">{new Date(goodsReceipt.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Items List */}
            <div className="md:col-span-2">
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-3">
                <div className="border-b border-border pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    Received Items
                  </h3>
                  <span className="text-xs text-secondary-text bg-background px-2.5 py-1 rounded-full border border-border">
                    Affects Warehouse Stock Level
                  </span>
                </div>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow hoverable={false}>
                        <TableHeaderCell>Product</TableHeaderCell>
                        <TableHeaderCell>SKU</TableHeaderCell>
                        <TableHeaderCell className="text-right w-44">Received Quantity</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {goodsReceipt.items.map((item) => {
                        const prod = productMap[item.product_id];
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-foreground">
                              {prod ? prod.name : "Loading product..."}
                            </TableCell>
                            <TableCell className="text-secondary-text">
                              {prod ? prod.sku : "-"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {item.quantity}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </div>
          </div>

          {/* Cancellation Dialog Confirmation */}
          <Dialog
            isOpen={isCancelOpen}
            onClose={() => setIsCancelOpen(false)}
            title="Cancel Goods Receipt"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsCancelOpen(false)}
                  disabled={cancelSubmitting}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubmit}
                  disabled={cancelSubmitting}
                >
                  {cancelSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {cancelError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium flex gap-2 items-start animate-fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Cancellation Failed</div>
                    <div>{cancelError}</div>
                  </div>
                </div>
              )}

              <p className="text-sm text-foreground">
                Are you sure you want to cancel the goods receipt sheet <span className="font-bold">"{goodsReceipt.id.substring(0, 8)}..."</span>?
              </p>

              <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs flex gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL STOCK IMPACT:</strong> This operation is permanent. It will subtract the received items from your warehouse inventory stock levels and revert the received counters on the associated Purchase Order.
                </span>
              </div>
            </div>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
