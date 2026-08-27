import React from "react";
import { StatusBadge } from "../common/status-badge";

interface SaleStatusBadgeProps {
  status: string;
  className?: string;
}

export const SaleStatusBadge = ({ status, className = "" }: SaleStatusBadgeProps) => {
  return <StatusBadge status={status} className={className} />;
};
