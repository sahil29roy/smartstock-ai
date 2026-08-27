"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { ChallanStatusBadge } from "@/components/challans/challan-status-badge";
import { ChallanItemsTable } from "@/components/challans/challan-items-table";
import { ChallanActions } from "@/components/challans/challan-actions";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSpinner } from "@/components/feedback/loading-state";
import { Card } from "@/components/ui/card";
import { challansClient } from "@/lib/api/challans.client";
import { productsClient } from "@/lib/products.client";
import { Challan, ChallanItem } from "@/types/sales/sales.types";
import { Product } from "@/types/product/product.types";
import { ArrowLeft, Truck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ChallanDetailParams {
  params: Promise<{ id: string }>;
}

export default function ChallanDetailPage({ params }: ChallanDetailParams) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const { user, loading: authLoading } = useAuth();

  const [challan, setChallan] = useState<(Challan & { items: ChallanItem[] }) | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allowed roles check
  const isAuthorized = React.useMemo(() => {
    if (authLoading) return true;
    return ["ADMIN", "WAREHOUSE", "SALES", "MANAGER"].includes(user?.role || "");
  }, [user, authLoading]);

  const fetchChallanDetails = useCallback(async () => {
    if (!isAuthorized) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Challan Details
      const challanResp = await challansClient.getChallanById(id);
      if (!challanResp.success) {
        throw new Error("Delivery challan not found.");
      }
      setChallan(challanResp.challan);

      // 2. Fetch Products
      const prodResp = await productsClient.getProducts({ includeDeleted: true });
      if (prodResp.success) {
        setProducts(prodResp.products);
      }
    } catch (err: any) {
      console.error("Failed to load delivery challan details:", err);
      setError(err.message || "Failed to load delivery challan details.");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthorized]);

  useEffect(() => {
    fetchChallanDetails();
  }, [fetchChallanDetails]);

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

  if (error) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <ErrorState
              title="Challan Error"
              message={error}
              onRetry={() => fetchChallanDetails()}
            />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (loading || !challan) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="flex flex-col items-center justify-center p-12">
              <LoadingSpinner />
              <p className="text-xs text-secondary-text mt-2">Loading challan details...</p>
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const totalQty = challan.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title={`Delivery Challan: ${challan.challan_number}`}
            description={`Dispatch Date: ${challan.dispatch_date ? new Date(challan.dispatch_date).toLocaleDateString() : "Pending"}`}
            actions={
              <div className="flex items-center gap-3">
                <ChallanStatusBadge status={challan.status} />
                <Link href={`/sales/${challan.sale_id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    View Sale Order
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/challans">
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    All Challans
                  </Button>
                </Link>
              </div>
            }
          />

          {/* Challan Actions */}
          <ChallanActions
            challan={challan}
            userRole={user?.role}
            onRefresh={fetchChallanDetails}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Shipped Items List */}
            <div className="lg:col-span-2">
              <Card className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Shipped Items</h3>
                <ChallanItemsTable items={challan.items} products={products} />
              </Card>
            </div>

            {/* Logistics & metadata summary */}
            <div className="space-y-6">
              <Card className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Shipment Details</h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Challan ID</span>
                    <span className="font-mono text-foreground font-semibold select-all">{challan.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Associated Sales Order</span>
                    <Link href={`/sales/${challan.sale_id}`} className="text-primary hover:underline font-mono font-semibold">
                      {challan.sale_id.substring(0, 8).toUpperCase()}...
                    </Link>
                  </div>
                  {challan.carrier_details && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Carrier & Vehicle Details</span>
                      <span className="text-foreground flex items-center gap-1.5 mt-0.5">
                        <Truck className="h-4 w-4 text-secondary-text shrink-0" />
                        {challan.carrier_details}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-4 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-secondary-text">Distinct Items</span>
                      <span className="font-semibold text-foreground">{challan.items.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1.5">
                      <span className="text-secondary-text">Total Quantity Shipped</span>
                      <span className="font-bold text-foreground text-sm">{totalQty} units</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
