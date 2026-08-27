import React from "react";
import { Badge } from "../ui/badge";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
  const cleanStatus = status.toUpperCase().trim();

  let variant: "success" | "warning" | "danger" | "neutral" = "neutral";

  if (["SUCCESS", "ACTIVE", "COMPLETED", "PAID", "IN_STOCK", "DELIVERED", "DISPATCHED"].includes(cleanStatus)) {
    variant = "success";
  } else if (["WARNING", "PENDING", "LOW_STOCK", "PARTIALLY_PAID"].includes(cleanStatus)) {
    variant = "warning";
  } else if (["DANGER", "CANCELLED", "OUT_OF_STOCK", "FAILED", "DESTRUCTIVE"].includes(cleanStatus)) {
    variant = "danger";
  }

  const label = cleanStatus
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};
