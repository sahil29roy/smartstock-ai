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
import { ChallanStatusBadge } from "./challan-status-badge";
import { Button } from "../ui/button";
import { Challan } from "@/types/sales/sales.types";
import { Eye } from "lucide-react";

interface ChallanTableProps {
  challans: Challan[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export const ChallanTable = ({
  challans,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: ChallanTableProps) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Challan Number</TableHeaderCell>
            <TableHeaderCell>Sale ID / Invoice</TableHeaderCell>
            <TableHeaderCell>Dispatch Date</TableHeaderCell>
            <TableHeaderCell>Carrier Details</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {challans.map((ch) => (
            <TableRow key={ch.id}>
              <TableCell className="font-mono text-xs font-semibold text-foreground">
                {ch.challan_number}
              </TableCell>
              <TableCell className="font-mono text-xs text-secondary-text">
                {ch.sale_id.substring(0, 8).toUpperCase()}...
              </TableCell>
              <TableCell className="text-secondary-text text-xs">
                {ch.dispatch_date
                  ? new Date(ch.dispatch_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </TableCell>
              <TableCell className="text-secondary-text text-xs max-w-[180px] truncate">
                {ch.carrier_details || "-"}
              </TableCell>
              <TableCell>
                <ChallanStatusBadge status={ch.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Link href={`/challans/${ch.id}`}>
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
