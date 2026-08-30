import React, { useState } from "react";
import Link from "next/link";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
} from "../ui/table";
import { StatusBadge } from "../common/status-badge";
import { Button } from "../ui/button";
import { InventoryWithProduct } from "@/types/inventory/inventory.types";
import { Category } from "@/types/category/category.types";
import { Eye, Sliders, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { UserRole } from "@/types/auth/auth.types";
import { Dialog } from "../ui/dialog";

interface InventoryTableProps {
  inventory: InventoryWithProduct[];
  categories: Category[];
  userRole?: UserRole;
  onAdjustClick: (item: InventoryWithProduct) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  aiInsights?: Record<string, {
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    summary: string;
    reasons: string[];
    recommendations: string[];
  }> | null;
}

export const InventoryTable = ({
  inventory,
  categories,
  userRole,
  onAdjustClick,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  aiInsights,
}: InventoryTableProps) => {
  const [selectedInsight, setSelectedInsight] = useState<{
    productName: string;
    sku: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    summary: string;
    reasons: string[];
    recommendations: string[];
  } | null>(null);

  const canAdjust = ["ADMIN", "WAREHOUSE", "MANAGER"].includes(userRole || "");

  // Create a quick category map
  const categoryMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Derived stock status
  const getStockStatus = (quantity: number, minStock: number): string => {
    if (quantity <= 0) return "OUT_OF_STOCK";
    if (quantity <= minStock) return "LOW_STOCK";
    return "IN_STOCK";
  };

  return (
    <>
      <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell className="text-center">Physical Stock</TableHeaderCell>
            <TableHeaderCell className="text-center">Reserved</TableHeaderCell>
            <TableHeaderCell className="text-center font-bold">Available</TableHeaderCell>
            <TableHeaderCell className="text-center">Min Stock</TableHeaderCell>
            <TableHeaderCell>Location</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {inventory.map((item) => {
            const availableStock = item.quantity - item.reserved_quantity;
            const status = getStockStatus(item.quantity, item.minimum_stock);

            return (
              <TableRow key={item.product_id}>
                <TableCell className="font-semibold text-foreground">
                  <div>
                    <div>{item.product_name}</div>
                    {aiInsights?.[item.product_id] && (
                      <button
                        onClick={() => setSelectedInsight({
                          productName: item.product_name,
                          sku: item.sku,
                          ...aiInsights[item.product_id]
                        })}
                        className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all border ${
                          aiInsights[item.product_id].riskLevel === "HIGH"
                            ? "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20"
                            : aiInsights[item.product_id].riskLevel === "MEDIUM"
                            ? "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
                            : "bg-primary-very-light text-primary border-primary-light/20 hover:bg-primary-very-light/80"
                        }`}
                        title="Click to view AI stock recommendation"
                      >
                        <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                        <span>{aiInsights[item.product_id].riskLevel} RISK INSIGHT</span>
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-secondary-text font-semibold">
                  {item.sku}
                </TableCell>
                <TableCell className="text-secondary-text">
                  {categoryMap[item.category_id] || "Unknown"}
                </TableCell>
                <TableCell className="text-center text-foreground font-medium">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-center text-secondary-text">
                  {item.reserved_quantity}
                </TableCell>
                <TableCell className="text-center text-foreground font-bold">
                  {availableStock}
                </TableCell>
                <TableCell className="text-center text-secondary-text">
                  {item.minimum_stock}
                </TableCell>
                <TableCell className="text-secondary-text">
                  {item.location || "-"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/inventory/${item.product_id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        title="View Stock Movements & Info"
                        className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    {canAdjust && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAdjustClick(item)}
                        title="Adjust Stock / Location"
                        className="p-1.5 h-8 border-border text-primary hover:bg-primary-very-light hover:border-primary-light/35"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </TableContainer>

      {/* AI Recommendation Dialog */}
      {selectedInsight && (
        <Dialog
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          title="AI Stock Risk Recommendation"
          size="md"
          footer={
            <Button variant="outline" size="sm" onClick={() => setSelectedInsight(null)} className="h-8 text-xs">
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-foreground text-sm">{selectedInsight.productName}</h4>
                <p className="text-[10px] text-secondary-text font-mono mt-0.5">SKU: {selectedInsight.sku}</p>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedInsight.riskLevel === "HIGH"
                    ? "bg-danger/10 text-danger border-danger/20"
                    : selectedInsight.riskLevel === "MEDIUM"
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-primary-very-light text-primary border-primary-light/20"
                }`}
              >
                {selectedInsight.riskLevel} RISK
              </span>
            </div>

            <div className="space-y-1">
              <h5 className="font-semibold text-xs text-foreground">AI Assessment Summary:</h5>
              <p className="text-xs text-secondary-text bg-background p-3 rounded-lg border border-border leading-relaxed">
                {selectedInsight.summary}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 font-semibold text-xs text-danger">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Reasons</span>
                </div>
                <ul className="list-disc pl-4 text-[11px] text-secondary-text space-y-1 leading-snug">
                  {selectedInsight.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1 font-semibold text-xs text-success">
                  <Lightbulb className="h-3.5 w-3.5 text-success" />
                  <span>AI Recommendations</span>
                </div>
                <ul className="list-disc pl-4 text-[11px] text-secondary-text space-y-1 leading-snug">
                  {selectedInsight.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};
