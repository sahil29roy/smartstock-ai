"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { productsClient } from "@/lib/products.client";
import { categoriesClient } from "@/lib/categories.client";
import { inventoryClient } from "@/lib/inventory.client";
import { Product } from "@/types/product/product.types";
import { Category } from "@/types/category/category.types";
import { Inventory, InventoryWithProduct, StockMovement } from "@/types/inventory/inventory.types";
import { StockMovementTable } from "@/components/inventory/stock-movement-table";
import { InventoryAdjustDialog } from "@/components/inventory/inventory-adjust-dialog";
import { ArrowLeft, Sliders, RefreshCw, Layers, Bookmark, AlertTriangle, Inbox, ShieldAlert } from "lucide-react";

interface InventoryDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default function InventoryDetailPage({ params }: InventoryDetailPageProps) {
  const { productId } = React.use(params);
  const { user } = useAuth();

  // Page States
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [isAdjustOpen, setIsAdjustOpen] = useState<boolean>(false);

  const userRole = user?.role;
  const canAdjust = ["ADMIN", "WAREHOUSE", "MANAGER"].includes(userRole || "");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Fetch categories
      const catRes = await categoriesClient.getCategories(true);
      if (catRes.success) {
        setCategories(catRes.categories);
      }

      // 2. Fetch product by ID
      const prodRes = await productsClient.getProductById(productId);
      if (prodRes.success) {
        setProduct(prodRes.product);
      } else {
        throw new Error("Product not found.");
      }

      // 3. Fetch inventory details
      const invRes = await inventoryClient.getInventoryByProductId(productId);
      if (invRes.success) {
        setInventory(invRes.inventory);
      }

      // 4. Fetch stock movements
      const movRes = await inventoryClient.getStockMovements(productId);
      if (movRes.success) {
        setMovements(movRes.movements);
      }
    } catch (err: any) {
      console.error("Failed loading inventory detail page data:", err);
      setError(
        err?.message || "An unexpected error occurred while loading details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-24 bg-surface border border-border rounded animate-pulse" />
            </div>
            <div className="h-16 bg-surface border border-border rounded-lg mb-6 animate-pulse" />
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="h-64 bg-surface border border-border rounded-lg animate-pulse md:col-span-2" />
              <div className="h-64 bg-surface border border-border rounded-lg animate-pulse" />
            </div>
            <div className="h-64 bg-surface border border-border rounded-lg animate-pulse" />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !product) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <Link href="/inventory" className="inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground mb-4">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Inventory
            </Link>
            <ErrorState
              title="Failed to load details"
              message={error || "Could not retrieve info for the specified product."}
              onRetry={() => loadData(false)}
            />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  // Derived stock calculations
  const physicalQty = inventory?.quantity || 0;
  const reservedQty = inventory?.reserved_quantity || 0;
  const availableQty = physicalQty - reservedQty;
  const minStock = product.minimum_stock;

  const getStockStatus = (qty: number, min: number): string => {
    if (qty <= 0) return "OUT_OF_STOCK";
    if (qty <= min) return "LOW_STOCK";
    return "IN_STOCK";
  };

  const status = getStockStatus(physicalQty, minStock);
  const categoryName = categories.find((c) => c.id === product.category_id)?.name || "Unknown Category";

  // Build the joined item structure needed for the Adjust Dialog
  const adjustItemData: InventoryWithProduct | null = inventory
    ? {
        ...inventory,
        product_name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        minimum_stock: product.minimum_stock,
      }
    : null;

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="space-y-1">
              <Link
                href="/inventory"
                className="inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground mb-1 font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Inventory
              </Link>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{product.name}</h1>
                <span className="font-mono text-xs font-semibold text-secondary-text bg-background border border-border px-2 py-0.5 rounded">
                  {product.sku}
                </span>
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 border-border text-foreground hover:bg-background h-9"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {canAdjust && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAdjustOpen(true)}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white font-semibold shadow-sm h-9"
                >
                  <Sliders className="h-4 w-4" />
                  Adjust Stock
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {/* Product Specifications Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-secondary-text font-semibold uppercase tracking-wider mb-0.5">Category</span>
                    <span className="text-foreground font-medium">{categoryName}</span>
                  </div>
                  <div>
                    <span className="block text-secondary-text font-semibold uppercase tracking-wider mb-0.5">Minimum Stock</span>
                    <span className="text-foreground font-medium">{product.minimum_stock} units</span>
                  </div>
                  <div>
                    <span className="block text-secondary-text font-semibold uppercase tracking-wider mb-0.5">Warehouse Location</span>
                    <span className="text-foreground font-medium">{inventory?.location || <span className="italic text-secondary-text">Unassigned</span>}</span>
                  </div>
                  <div>
                    <span className="block text-secondary-text font-semibold uppercase tracking-wider mb-0.5">Unit Value</span>
                    <span className="text-foreground font-medium">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price)}
                    </span >
                  </div>
                  <div>
                    <span className="block text-secondary-text font-semibold uppercase tracking-wider mb-0.5">Stock Valuation</span>
                    <span className="text-foreground font-medium">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(product.price * physicalQty)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-secondary-text font-semibold uppercase tracking-wider mb-0.5">Status</span>
                    <span className="inline-flex mt-0.5"><StatusBadge status={status} /></span>
                  </div>
                </div>

                {product.description && (
                  <div className="pt-4 border-t border-border">
                    <span className="block text-xs text-secondary-text font-semibold uppercase tracking-wider mb-1">Description</span>
                    <p className="text-xs text-foreground leading-relaxed">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Stock Levels Card */}
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Stock Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4.5 w-4.5 text-secondary-text" />
                    <span className="text-xs text-foreground font-medium">Physical Stock</span>
                  </div>
                  <span className="text-base font-bold text-foreground">{physicalQty}</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4.5 w-4.5 text-primary-light" />
                    <span className="text-xs text-foreground font-medium">Reserved Stock</span>
                  </div>
                  <span className="text-sm font-semibold text-secondary-text">{reservedQty}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4.5 w-4.5 text-success" />
                    <span className="text-xs text-foreground font-bold">Available Stock</span>
                  </div>
                  <span className="text-lg font-extrabold text-primary">{availableQty}</span>
                </div>

                {physicalQty <= minStock && (
                  <div className="mt-4 p-3 bg-warning/5 border border-warning/10 rounded flex items-start gap-2 text-[11px] text-warning">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Reorder Alert</p>
                      <p className="mt-0.5 leading-relaxed">This product's current stock ({physicalQty}) is at or below its defined minimum limit ({minStock}).</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stock Movement History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
            </CardHeader>
            <CardContent>
              <StockMovementTable movements={movements} />
            </CardContent>
          </Card>

          {/* Adjustment Dialog */}
          {adjustItemData && (
            <InventoryAdjustDialog
              isOpen={isAdjustOpen}
              onClose={() => setIsAdjustOpen(false)}
              item={adjustItemData}
              onSuccess={() => loadData(true)}
            />
          )}
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
