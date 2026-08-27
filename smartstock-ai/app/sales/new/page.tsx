"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { CreateSaleForm } from "@/components/sales/create-sale-form";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSpinner } from "@/components/feedback/loading-state";
import { customersClient } from "@/lib/api/customers.client";
import { productsClient } from "@/lib/products.client";
import { inventoryClient } from "@/lib/inventory.client";
import { salesClient } from "@/lib/api/sales.client";
import { Customer } from "@/types/customer/customer.types";
import { Product } from "@/types/product/product.types";
import { useRouter } from "next/navigation";

export default function NewSalePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, { quantity: number; reserved: number }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Allowed roles check
  const isAuthorized = React.useMemo(() => {
    if (authLoading) return true;
    return ["ADMIN", "SALES"].includes(user?.role || "");
  }, [user, authLoading]);

  const loadFormData = useCallback(async () => {
    if (!isAuthorized) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Customers
      const custResp = await customersClient.getCustomers(false);
      if (custResp.success) {
        setCustomers(custResp.customers);
      }

      // 2. Fetch Products
      const prodResp = await productsClient.getProducts({ includeDeleted: false });
      if (prodResp.success) {
        setProducts(prodResp.products);
      }

      // 3. Fetch Inventory
      const invResp = await inventoryClient.getInventory();
      if (invResp.success) {
        const invMap: Record<string, { quantity: number; reserved: number }> = {};
        invResp.inventory.forEach((item) => {
          invMap[item.product_id] = {
            quantity: item.quantity,
            reserved: item.reserved_quantity,
          };
        });
        setInventoryMap(invMap);
      }
    } catch (err: any) {
      console.error("Failed to load create sales order form data:", err);
      setError(err.message || "Failed to load active catalog and inventory data.");
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const handleSubmit = async (payload: {
    customer_id: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
  }) => {
    setSubmitLoading(true);
    try {
      const response = await salesClient.createSale({
        customer_id: payload.customer_id,
        items: payload.items,
      });

      if (response.success && response.sale) {
        router.push(`/sales/${response.sale.id}`);
      } else {
        throw new Error("Unable to create sales order.");
      }
    } catch (err: any) {
      console.error("Failed to submit sales order:", err);
      throw err;
    } finally {
      setSubmitLoading(false);
    }
  };

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
          <PageHeader
            title="Create Sales Order"
            description="Configure a new sales order with line items, automatically updating stock reservations."
          />

          {error ? (
            <ErrorState
              title="Error Loading Form"
              message={error}
              onRetry={() => loadFormData()}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <LoadingSpinner />
              <p className="text-xs text-secondary-text mt-2">Loading customer and catalog inventory...</p>
            </div>
          ) : (
            <CreateSaleForm
              customers={customers}
              products={products}
              inventoryMap={inventoryMap}
              onSubmit={handleSubmit}
              loading={submitLoading}
            />
          )}
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
