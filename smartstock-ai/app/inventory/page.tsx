"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { inventoryClient } from "@/lib/inventory.client";
import { categoriesClient } from "@/lib/categories.client";
import { InventoryWithProduct } from "@/types/inventory/inventory.types";
import { Category } from "@/types/category/category.types";
import { InventorySummary } from "@/components/inventory/inventory-summary";
import { InventoryFilters } from "@/components/inventory/inventory-filters";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { InventoryAdjustDialog } from "@/components/inventory/inventory-adjust-dialog";
import { Inbox } from "lucide-react";

export default function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Dialog State
  const [adjustItem, setAdjustItem] = useState<InventoryWithProduct | null>(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState<boolean>(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const response = await categoriesClient.getCategories(false);
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error("Failed to load categories for filtering:", err);
    }
  }, []);

  // Fetch inventory
  const fetchInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await inventoryClient.getInventory();
      if (response.success) {
        setInventory(response.inventory);
      } else {
        setError("Failed to fetch inventory records.");
      }
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      setError(
        err?.message || "An unexpected error occurred while loading inventory."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCategories();
    fetchInventory();
  }, [loadCategories, fetchInventory]);

  // Filter application (client-side)
  const filteredInventory = React.useMemo(() => {
    return inventory.filter((item) => {
      // Search matches product name or SKU
      const searchMatch =
        !search.trim() ||
        item.product_name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase());

      // Category matches
      const categoryMatch =
        !selectedCategoryId || item.category_id === selectedCategoryId;

      // Status matches
      let statusMatch = true;
      if (selectedStatus !== "ALL") {
        const isOutOfStock = item.quantity <= 0;
        const isLowStock = item.quantity > 0 && item.quantity <= item.minimum_stock;
        const isInStock = item.quantity > item.minimum_stock;

        if (selectedStatus === "OUT_OF_STOCK") statusMatch = isOutOfStock;
        if (selectedStatus === "LOW_STOCK") statusMatch = isLowStock;
        if (selectedStatus === "IN_STOCK") statusMatch = isInStock;
      }

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [inventory, search, selectedCategoryId, selectedStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategoryId, selectedStatus]);

  // Pagination calculations
  const totalItems = filteredInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdjustClick = (item: InventoryWithProduct) => {
    setAdjustItem(item);
    setIsAdjustOpen(true);
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Inventory Management"
            description="View and adjust product stock levels, reservations, locations and transaction history."
          />

          {loading ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-surface border border-border rounded-lg animate-pulse" />
                ))}
              </div>
              <LoadingTable rows={6} cols={10} />
            </div>
          ) : error ? (
            <ErrorState
              title="Unable to load inventory"
              message={error}
              onRetry={() => fetchInventory(false)}
            />
          ) : (
            <>
              {/* Summary KPIs */}
              <InventorySummary inventory={inventory} />

              {/* Filters Area */}
              <InventoryFilters
                search={search}
                onSearchChange={setSearch}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                categories={categories}
                onRefresh={() => fetchInventory(true)}
                refreshing={refreshing}
              />

              {/* Data Table */}
              {totalItems === 0 ? (
                <EmptyState
                  title={search || selectedCategoryId || selectedStatus !== "ALL" ? "No matches found" : "No inventory records"}
                  description={
                    search || selectedCategoryId || selectedStatus !== "ALL"
                      ? "Try adjusting your filters or search terms."
                      : "No inventory rows are active in the system."
                  }
                  icon={<Inbox className="h-6 w-6 text-secondary-text" />}
                />
              ) : (
                <InventoryTable
                  inventory={paginatedInventory}
                  categories={categories}
                  userRole={user?.role}
                  onAdjustClick={handleAdjustClick}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              )}
            </>
          )}

          {/* Adjustment Dialog */}
          <InventoryAdjustDialog
            isOpen={isAdjustOpen}
            onClose={() => {
              setIsAdjustOpen(false);
              setAdjustItem(null);
            }}
            item={adjustItem}
            onSuccess={() => fetchInventory(true)}
          />
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
