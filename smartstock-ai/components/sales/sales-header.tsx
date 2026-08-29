import React from "react";
import { PageHeader } from "../common/page-header";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/auth/auth.types";

interface SalesHeaderProps {
  userRole?: UserRole;
}

export const SalesHeader = ({ userRole }: SalesHeaderProps) => {
  const canCreate = ["ADMIN", "SALES"].includes(userRole || "");

  const actions = canCreate ? (
    <Link href="/sales/new">
      <Button size="sm" className="flex items-center gap-1.5">
        <Plus className="h-4 w-4" />
        Create Sale
      </Button>
    </Link>
  ) : null;

  return (
    <PageHeader
      title="Sales"
      description="Manage sales orders, fulfillment, and payment status."
      actions={actions}
    />
  );
};
