import React from "react";
import { SearchInput } from "../common/search-input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";

interface ChallanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export const ChallanFilters = ({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  onRefresh,
  refreshing = false,
}: ChallanFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      <div className="grid gap-3 sm:grid-cols-2 flex-1">
        <div>
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Challan No. or Sale ID..."
            className="w-full"
          />
        </div>

        <div>
          <Select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
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
