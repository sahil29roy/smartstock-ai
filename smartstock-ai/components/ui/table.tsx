import React from "react";
import { Button } from "./button";

export const TableContainer = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`w-full overflow-x-auto rounded-lg border border-border bg-surface ${className}`}>
    {children}
  </div>
);

export const Table = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <table className={`w-full text-left text-sm border-collapse ${className}`}>
    {children}
  </table>
);

export const TableHead = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <thead className={`bg-background border-b border-border ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <tbody className={`divide-y divide-border ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ className = "", hoverable = true, children }: { className?: string; hoverable?: boolean; children: React.ReactNode }) => (
  <tr className={`${hoverable ? "hover:bg-primary-very-light/20 dark:hover:bg-primary-light/5" : ""} transition-colors ${className}`}>
    {children}
  </tr>
);

export const TableHeaderCell = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <th className={`px-4 py-2.5 font-semibold text-secondary-text text-xs uppercase tracking-wider select-none ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <td className={`px-4 py-2.5 text-foreground align-middle text-sm ${className}`}>
    {children}
  </td>
);

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = "",
}: TablePaginationProps) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-surface ${className}`}>
      <span className="text-xs text-secondary-text">
        Showing <span className="font-semibold text-foreground">{totalItems > 0 ? startItem : 0}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> results
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <div className="flex items-center text-xs font-semibold px-2">
          Page {currentPage} of {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
