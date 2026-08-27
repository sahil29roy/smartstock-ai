import React from "react";
import { SearchInput } from "../common/search-input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Category } from "@/types/category/category.types";
import { RefreshCw } from "lucide-react";

interface InventoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  categories: Category[];
  onRefresh: () => void;
  refreshing?: boolean;
}

export const InventoryFilters = ({
  search,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories,
  onRefresh,
  refreshing = false,
}: InventoryFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      <div className="grid gap-3 sm:grid-cols-3 flex-1">
        <div>
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or SKU..."
            className="w-full"
          />
        </div>

        <div>
          <Select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full"
          >
            <option value="">All Categories</option>
            {categories
              .filter((c) => !c.deleted_at)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </div>

        <div>
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-end shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 h-10 border-border text-foreground hover:bg-background"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
};
