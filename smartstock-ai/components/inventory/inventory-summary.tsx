import React from "react";
import { KpiCard } from "../ui/card";
import { InventoryWithProduct } from "@/types/inventory/inventory.types";
import { Package, Layers, AlertTriangle, XOctagon, Bookmark } from "lucide-react";

interface InventorySummaryProps {
  inventory: InventoryWithProduct[];
}

export const InventorySummary = ({ inventory }: InventorySummaryProps) => {
  const totalProducts = inventory.length;

  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  const lowStockCount = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.minimum_stock
  ).length;

  const outOfStockCount = inventory.filter((item) => item.quantity <= 0).length;

  const reservedUnits = inventory.reduce((sum, item) => sum + item.reserved_quantity, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
      <KpiCard
        title="Total Products"
        value={totalProducts}
        icon={<Package className="h-4 w-4" />}
        description="Active items in catalog"
      />
      <KpiCard
        title="Total Units"
        value={totalUnits}
        icon={<Layers className="h-4 w-4" />}
        description="Physical units in stock"
      />
      <KpiCard
        title="Low Stock"
        value={lowStockCount}
        icon={<AlertTriangle className="h-4 w-4 text-warning" />}
        change={lowStockCount > 0 ? "Alert" : undefined}
        changeType="neutral"
        description="Items below minimum"
      />
      <KpiCard
        title="Out of Stock"
        value={outOfStockCount}
        icon={<XOctagon className="h-4 w-4 text-danger" />}
        change={outOfStockCount > 0 ? "Critical" : undefined}
        changeType="decrease"
        description="Zero stock available"
      />
      <KpiCard
        title="Reserved Units"
        value={reservedUnits}
        icon={<Bookmark className="h-4 w-4 text-primary" />}
        description="Committed to sales orders"
      />
    </div>
  );
};
