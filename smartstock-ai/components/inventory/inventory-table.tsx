import React from "react";
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
import { Eye, Sliders } from "lucide-react";
import { UserRole } from "@/types/auth/auth.types";

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
}: InventoryTableProps) => {
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
                  {item.product_name}
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
  );
};
