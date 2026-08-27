"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/feedback/error-state";
import { purchasesClient } from "@/lib/api/purchases.client";
import { suppliersClient } from "@/lib/api/suppliers.client";
import { productsClient } from "@/lib/products.client";
import { Supplier } from "@/types/procurement/procurement.types";
import { Product } from "@/types/product/product.types";
import { ArrowLeft, Plus, Trash2, ShoppingBag, AlertTriangle, AlertCircle } from "lucide-react";

interface POItemRow {
  productId: string;
  quantity: number;
  unitCost: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [items, setItems] = useState<POItemRow[]>([{ productId: "", quantity: 1, unitCost: 0 }]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load suppliers and products
  const loadFormData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        suppliersClient.getSuppliers({ activeOnly: true }),
        productsClient.getProducts(),
      ]);

      if (suppliersRes.success) {
        setSuppliers(suppliersRes.suppliers);
      } else {
        setError("Failed to load active suppliers.");
      }

      if (productsRes.success) {
        setProducts(productsRes.products);
      } else {
        setError("Failed to load products list.");
      }
    } catch (err: any) {
      console.error("Error loading PO form dependencies:", err);
      setError(
        err?.message || "An unexpected error occurred while loading form data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  // Options for Supplier Select
  const supplierOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select a supplier..." }];
    suppliers.forEach((s) => {
      opts.push({ value: s.id, label: s.name });
    });
    return opts;
  }, [suppliers]);

  // Options for Product Selects
  const productOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select a product..." }];
    products.forEach((p) => {
      opts.push({ value: p.id, label: `${p.name} (SKU: ${p.sku})` });
    });
    return opts;
  }, [products]);

  // Calculate totals
  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }, [items]);

  // Add Item Row
  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitCost: 0 }]);
    setValidationError(null);
  };

  // Remove Item Row
  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setValidationError(null);
  };

  // Update Field inside Row
  const handleUpdateItemRow = (index: number, field: keyof POItemRow, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "productId") {
        // Automatically default unit cost if product has cost, or let user enter it.
        const prod = products.find((p) => p.id === value);
        // If product is found and has cost/price, default it
        const defaultCost = 0; // If product types have cost price, default it.
        updated[index] = {
          ...updated[index],
          productId: value,
          unitCost: defaultCost,
        };
      } else if (field === "quantity") {
        const qty = parseInt(value, 10);
        updated[index] = {
          ...updated[index],
          quantity: isNaN(qty) ? 0 : Math.max(1, qty),
        };
      } else if (field === "unitCost") {
        const cost = parseFloat(value);
        updated[index] = {
          ...updated[index],
          unitCost: isNaN(cost) ? 0 : Math.max(0, cost),
        };
      }
      return updated;
    });
    setValidationError(null);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedSupplierId) {
      setValidationError("Please select a supplier.");
      return;
    }

    if (items.length === 0) {
      setValidationError("Please add at least one item to the order.");
      return;
    }

    // Check duplicate products
    const selectedProductIds = items.map((i) => i.productId).filter(Boolean);
    const uniqueProductIds = new Set(selectedProductIds);
    if (selectedProductIds.length !== uniqueProductIds.size) {
      setValidationError("Duplicate products detected. Please combine duplicate items.");
      return;
    }

    // Validate rows
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.productId) {
        setValidationError(`Please select a product for line ${i + 1}.`);
        return;
      }
      if (row.quantity <= 0) {
        setValidationError(`Quantity must be greater than zero for line ${i + 1}.`);
        return;
      }
      if (row.unitCost < 0) {
        setValidationError(`Unit cost cannot be negative for line ${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier_id: selectedSupplierId,
        items: items.map((row) => ({
          product_id: row.productId,
          quantity: row.quantity,
          unit_cost: row.unitCost,
        })),
      };

      const response = await purchasesClient.createPurchase(payload);
      if (response.success) {
        router.push(`/purchases/${response.purchase.id}`);
      } else {
        setValidationError("Failed to create purchase order.");
      }
    } catch (err: any) {
      console.error("Error creating PO:", err);
      setValidationError(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <div className="mb-6">
            <Link href="/purchases" passHref>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground hover:bg-background border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Purchase Orders
              </Button>
            </Link>
          </div>

          <PageHeader
            title="Create Purchase Order"
            description="Initialize a new purchase order sheet. Items will default to DRAFT state."
          />

          {error ? (
            <ErrorState
              title="Unable to initialize form"
              message={error}
              onRetry={loadFormData}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* General Settings Card */}
                <div className="md:col-span-1">
                  <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      Order Details
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                        Supplier <span className="text-danger">*</span>
                      </label>
                      <Select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        disabled={loading || submitting}
                        className="w-full"
                      >
                        {supplierOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-secondary-text font-medium">Items Count:</span>
                        <span className="font-bold text-foreground">{items.length}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-dashed border-border">
                        <span className="text-foreground font-bold">Grand Total:</span>
                        <span className="font-extrabold text-primary">
                          ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Items Grid Card */}
                <div className="md:col-span-2 space-y-4">
                  <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="text-sm font-bold text-foreground">Line Items</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItemRow}
                        disabled={submitting}
                        className="flex items-center gap-1.5 text-xs border-primary-light/40 text-primary hover:bg-primary-very-light"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Item
                      </Button>
                    </div>

                    {validationError && (
                      <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium flex gap-2 items-center">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {items.map((row, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end border-b border-border/50 sm:border-0 pb-4 sm:pb-0">
                          {/* Product Selection */}
                          <div className="flex-1 space-y-1">
                            {index === 0 && (
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
                                Product <span className="text-danger">*</span>
                              </label>
                            )}
                            <Select
                              value={row.productId}
                              onChange={(e) => handleUpdateItemRow(index, "productId", e.target.value)}
                              disabled={submitting}
                              className="w-full"
                            >
                              {productOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </div>

                          {/* Quantity */}
                          <div className="w-full sm:w-28 space-y-1">
                            {index === 0 && (
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
                                Quantity <span className="text-danger">*</span>
                              </label>
                            )}
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={row.quantity}
                              onChange={(e) => handleUpdateItemRow(index, "quantity", e.target.value)}
                              placeholder="1"
                              disabled={submitting}
                              className="w-full"
                            />
                          </div>

                          {/* Unit Cost */}
                          <div className="w-full sm:w-32 space-y-1">
                            {index === 0 && (
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
                                Unit Cost ($) <span className="text-danger">*</span>
                              </label>
                            )}
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.unitCost}
                              onChange={(e) => handleUpdateItemRow(index, "unitCost", e.target.value)}
                              placeholder="0.00"
                              disabled={submitting}
                              className="w-full"
                            />
                          </div>

                          {/* Subtotal Display */}
                          <div className="w-full sm:w-28 text-right sm:pb-2.5">
                            {index === 0 && (
                              <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block text-right mb-1">
                                Subtotal
                              </span>
                            )}
                            <span className="text-xs font-semibold text-foreground">
                              ${(row.quantity * row.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Remove Button */}
                          <div className="sm:pb-1 text-right sm:text-left">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItemRow(index)}
                              disabled={items.length === 1 || submitting}
                              className="p-1.5 border-border text-danger hover:bg-danger/10 hover:border-danger/30"
                              title="Delete Item Row"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                      <Link href="/purchases" passHref>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? "Saving PO..." : "Save Purchase Order"}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </form>
          )}
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
