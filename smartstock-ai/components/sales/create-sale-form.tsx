import React, { useState } from "react";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { SaleItemForm } from "./sale-item-form";
import { Customer } from "@/types/customer/customer.types";
import { Product } from "@/types/product/product.types";
import { Plus, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface CreateSaleFormProps {
  customers: Customer[];
  products: Product[];
  inventoryMap: Record<string, { quantity: number; reserved: number }>;
  onSubmit: (payload: {
    customer_id: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
  }) => Promise<void>;
  loading?: boolean;
}

export const CreateSaleForm = ({
  customers,
  products,
  inventoryMap,
  onSubmit,
  loading = false,
}: CreateSaleFormProps) => {
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([
    { product_id: "", quantity: 1, unit_price: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Add a new empty row
  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  // Remove a row
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems.length > 0 ? newItems : [{ product_id: "", quantity: 1, unit_price: 0 }]);
  };

  // Change individual field of a row
  const handleItemChange = (
    index: number,
    field: "product_id" | "quantity" | "unit_price",
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Reactive calculations (non-authoritative, for UI display)
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerId) {
      setFormError("Please select a customer.");
      return;
    }

    // Filter out rows without a selected product
    const validItems = items.filter((item) => item.product_id !== "");
    if (validItems.length === 0) {
      setFormError("Please add at least one product line item.");
      return;
    }

    // Validate quantities and prices
    for (const item of validItems) {
      if (item.quantity <= 0) {
        setFormError("Quantity must be a positive integer.");
        return;
      }
      if (item.unit_price < 0) {
        setFormError("Unit price cannot be negative.");
        return;
      }
    }

    // Prevent duplicate products
    const productIds = validItems.map((item) => item.product_id);
    const hasDuplicates = productIds.some((id, idx) => productIds.indexOf(id) !== idx);
    if (hasDuplicates) {
      setFormError("Please ensure each product is only added once. Adjust quantities instead of adding duplicate rows.");
      return;
    }

    try {
      await onSubmit({
        customer_id: customerId,
        items: validItems,
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to create sales order.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="p-3 bg-danger/10 text-danger border border-danger/20 rounded-lg text-sm font-semibold">
          {formError}
        </div>
      )}

      {/* Customer Selection Section */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">A. Customer Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-secondary-text block mb-1">
              Select Customer <span className="text-danger">*</span>
            </label>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full"
              required
            >
              <option value="">Choose Customer</option>
              {customers
                .filter((c) => !c.deleted_at)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>

          {selectedCustomer && (
            <div className="border border-border rounded-lg p-3 bg-background/50 dark:bg-background/25 text-xs space-y-1 text-secondary-text">
              <p className="font-bold text-foreground mb-1">Customer Info Preview:</p>
              <p>Email: <span className="text-foreground">{selectedCustomer.email}</span></p>
              <p>Phone: <span className="text-foreground">{selectedCustomer.phone || "N/A"}</span></p>
              <p>Address: <span className="text-foreground">{selectedCustomer.address || "N/A"}</span></p>
              {selectedCustomer.gst_number && (
                <p>GSTIN: <span className="font-mono text-foreground">{selectedCustomer.gst_number}</span></p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Sale Items Section */}
      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-foreground">B. Sale Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <SaleItemForm
              key={index}
              index={index}
              item={item}
              products={products}
              inventoryMap={inventoryMap}
              onChange={(field, val) => handleItemChange(index, field, val)}
              onRemove={() => handleRemoveItem(index)}
            />
          ))}
        </div>
      </Card>

      {/* Sale Summary Section */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">C. Sale Summary</h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 mb-4">
          <div className="text-xs text-secondary-text space-y-1">
            <p>Total Items: <span className="font-semibold text-foreground">{items.filter((i) => i.product_id).length}</span></p>
            <p>Total Quantity: <span className="font-semibold text-foreground">{totalQuantity}</span></p>
          </div>
          <div className="text-right mt-2 sm:mt-0">
            <span className="text-xs text-secondary-text block">Total Amount</span>
            <span className="text-2xl font-bold text-primary">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Link href="/sales">
            <Button type="button" variant="outline" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex items-center gap-1.5">
            <Save className="h-4 w-4" />
            {loading ? "Creating..." : "Save Sales Order"}
          </Button>
        </div>
      </Card>
    </form>
  );
};
