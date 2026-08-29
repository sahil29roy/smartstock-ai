import React from "react";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Product } from "@/types/product/product.types";

interface SaleItemFormProps {
  index: number;
  item: { product_id: string; quantity: number; unit_price: number };
  products: Product[];
  inventoryMap: Record<string, { quantity: number; reserved: number }>;
  onChange: (field: "product_id" | "quantity" | "unit_price", value: any) => void;
  onRemove: () => void;
}

export const SaleItemForm = ({
  index,
  item,
  products,
  inventoryMap,
  onChange,
  onRemove,
}: SaleItemFormProps) => {
  const selectedProduct = products.find((p) => p.id === item.product_id);
  const stock = item.product_id ? inventoryMap[item.product_id] : null;
  const availableStock = stock ? stock.quantity - stock.reserved : 0;
  const isOutOfStock = stock ? availableStock <= 0 : false;
  const isStockWarning = stock ? item.quantity > availableStock : false;

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    const prod = products.find((p) => p.id === prodId);
    onChange("product_id", prodId);
    if (prod) {
      onChange("unit_price", parseFloat(prod.price as any) || 0);
    }
  };

  return (
    <div className="border border-border rounded-lg p-3 bg-background/50 dark:bg-background/20 mb-3">
      <div className="grid gap-3 sm:grid-cols-12 items-end">
        {/* Product Dropdown */}
        <div className="sm:col-span-5">
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            Product
          </label>
          <Select
            value={item.product_id}
            onChange={handleProductChange}
            className="w-full"
          >
            <option value="">Select a Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        {/* SKU Label (Read-only) */}
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            SKU
          </label>
          <div className="h-9 px-3 border border-border bg-surface rounded-lg flex items-center text-xs font-mono text-secondary-text overflow-hidden select-all">
            {selectedProduct?.sku || "-"}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            Quantity
          </label>
          <Input
            type="number"
            min="1"
            value={item.quantity || ""}
            onChange={(e) => onChange("quantity", parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full"
          />
        </div>

        {/* Unit Price Input */}
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
            Unit Price ($)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.unit_price || ""}
            onChange={(e) => onChange("unit_price", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full"
          />
        </div>

        {/* Remove Button */}
        <div className="sm:col-span-1 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            title="Remove item"
            className="text-danger hover:bg-danger/10 p-2 h-9 w-9 border border-transparent"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stock level indicators */}
      {item.product_id && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-secondary-text">
            Available Stock: <span className="font-semibold text-foreground">{availableStock}</span>
          </span>
          {isOutOfStock ? (
            <span className="text-danger font-semibold">Out of Stock!</span>
          ) : isStockWarning ? (
            <span className="text-warning font-semibold">Exceeds available stock ({availableStock})!</span>
          ) : null}
        </div>
      )}
    </div>
  );
};
