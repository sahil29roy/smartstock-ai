import React from "react";
import { Skeleton } from "../ui/skeleton";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "../ui/table";
import { Card } from "../ui/card";

export const LoadingTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHeaderCell key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r} hoverable={false}>
              {Array.from({ length: cols }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const LoadingCards = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-32 mt-1" />
          <Skeleton className="h-3.5 w-40 mt-3" />
        </Card>
      ))}
    </div>
  );
};

export const LoadingSpinner = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-light/35 border-t-primary" />
    </div>
  );
};
