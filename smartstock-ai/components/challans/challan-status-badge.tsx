import React from "react";
import { StatusBadge } from "../common/status-badge";

interface ChallanStatusBadgeProps {
  status: string;
  className?: string;
}

export const ChallanStatusBadge = ({ status, className = "" }: ChallanStatusBadgeProps) => {
  return <StatusBadge status={status} className={className} />;
};
