import React from "react";
import { SearchInput } from "../common/search-input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Customer } from "@/types/customer/customer.types";
import { RefreshCw } from "lucide-react";

interface SalesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCustomerId: string;
  onCustomerChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  customers: Customer[];
  onRefresh: () => void;
  refreshing?: boolean;
}

export const SalesFilters = ({
  search,
  onSearchChange,
  selectedCustomerId,
  onCustomerChange,
  selectedStatus,
  onStatusChange,
  customers,
  onRefresh,
  refreshing = false,
}: SalesFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
      <div className="grid gap-3 sm:grid-cols-3 flex-1">
        <div>
          <SearchInput
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Sale ID..."
            className="w-full"
          />
        </div>

        <div>
          <Select
            value={selectedCustomerId}
            onChange={(e) => onCustomerChange(e.target.value)}
            className="w-full"
          >
            <option value="">All Customers</option>
            {customers
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
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
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
