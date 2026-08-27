import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { StockMovement, StockMovementType } from "@/types/inventory/inventory.types";
import { EmptyState } from "../feedback/empty-state";
import { History } from "lucide-react";

interface StockMovementTableProps {
  movements: StockMovement[];
}

export const StockMovementTable = ({ movements }: StockMovementTableProps) => {
  if (movements.length === 0) {
    return (
      <EmptyState
        title="No movements recorded"
        description="There are no physical movements logged for this product yet."
        icon={<History className="h-6 w-6 text-secondary-text" />}
      />
    );
  }

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case "IN":
        return <Badge variant="success">IN</Badge>;
      case "OUT":
        return <Badge variant="neutral">OUT</Badge>;
      case "ADJUSTMENT":
        return <Badge variant="warning">ADJUSTMENT</Badge>;
      case "DAMAGE":
      case "LOSS":
        return <Badge variant="danger">{type}</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const formatQuantity = (qty: number) => {
    if (qty > 0) return <span className="text-success font-semibold">+{qty}</span>;
    return <span className="text-danger font-semibold">{qty}</span>;
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Date & Time</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell className="text-right">Quantity Change</TableHeaderCell>
            <TableHeaderCell>Reason / Description</TableHeaderCell>
            <TableHeaderCell className="text-right">Recorded By (ID)</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="text-secondary-text text-xs">
                {new Date(movement.created_at).toLocaleString()}
              </TableCell>
              <TableCell>{getMovementBadge(movement.type)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatQuantity(movement.quantity)}
              </TableCell>
              <TableCell>
                <div className="text-foreground text-xs max-w-xs truncate" title={movement.reason || ""}>
                  {movement.reason || <span className="text-secondary-text italic">No description</span>}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] text-secondary-text">
                {movement.created_by || "System"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
