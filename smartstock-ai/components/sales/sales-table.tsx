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
import { SaleStatusBadge } from "./sale-status-badge";
import { Button } from "../ui/button";
import { Sale } from "@/types/sales/sales.types";
import { Customer } from "@/types/customer/customer.types";
import { Eye } from "lucide-react";
import { UserRole } from "@/types/auth/auth.types";

interface SalesTableProps {
  sales: Sale[];
  customers: Customer[];
  userRole?: UserRole;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const SalesTable = ({
  sales,
  customers,
  userRole,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: SalesTableProps) => {
  // Create a quick customer map
  const customerMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    customers.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [customers]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Sale ID / Invoice</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell className="text-right">Total Amount</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-mono text-xs font-semibold text-foreground">
                {sale.id.substring(0, 8).toUpperCase()}...
              </TableCell>
              <TableCell className="font-semibold text-foreground">
                {customerMap[sale.customer_id] || "Unknown Customer"}
              </TableCell>
              <TableCell className="text-secondary-text">
                {new Date(sale.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right font-bold text-foreground">
                ${sale.total_amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <SaleStatusBadge status={sale.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Link href={`/sales/${sale.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      title="View Details"
                      className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
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
