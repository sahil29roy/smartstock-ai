import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { Account } from "@/types/accounts/accounts.types";
import { Edit, Eye } from "lucide-react";

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onView: (id: string) => void;
  userRole?: string;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(val);
};

const formatDate = (dateStr: Date | string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export const AccountsTable = ({ accounts, onEdit, onView, userRole }: AccountsTableProps) => {
  const canEdit = ["ADMIN", "ACCOUNTS"].includes(userRole || "");

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-lg bg-surface/50 text-center select-none">
        <p className="text-sm font-medium text-foreground">No accounts found.</p>
        <p className="text-xs text-secondary-text mt-1">Create an account to begin tracking finances.</p>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow hoverable={false}>
            <TableHeaderCell>Account Name</TableHeaderCell>
            <TableHeaderCell>Account Type</TableHeaderCell>
            <TableHeaderCell className="text-right">Balance</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Last Updated</TableHeaderCell>
            <TableHeaderCell className="text-center">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="text-foreground">{account.name}</div>
                  {account.description && (
                    <div className="text-xs text-secondary-text max-w-[200px] truncate">
                      {account.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-background border border-border text-foreground tracking-wide">
                  {account.type}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell>
                <StatusBadge status="ACTIVE" />
              </TableCell>
              <TableCell className="text-secondary-text select-none">
                {formatDate(account.updated_at)}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(account.id)}
                    title="View Transactions"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(account)}
                      title="Edit Account"
                      className="h-8 w-8 p-0 text-primary hover:text-primary-dark"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
