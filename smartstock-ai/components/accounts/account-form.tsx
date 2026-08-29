import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { accountsClient } from "@/lib/api/accounts.client";
import { Account, AccountType } from "@/types/accounts/accounts.types";

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  account: Account | null;
}

export const AccountForm = ({ isOpen, onClose, onSubmitSuccess, account }: AccountFormProps) => {
  const isEditMode = !!account;

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [balance, setBalance] = useState("");
  const [description, setDescription] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (account) {
        setName(account.name);
        setType(account.type);
        setBalance(account.balance.toString());
        setDescription(account.description || "");
      } else {
        setName("");
        setType("CASH");
        setBalance("0");
        setDescription("");
      }
      setFieldErrors({});
      setGeneralError(null);
    }
  }, [isOpen, account]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = "Account name cannot be empty.";
    } else if (name.length > 100) {
      errors.name = "Name must be 100 characters or less.";
    }

    if (!isEditMode) {
      const parsedBalance = parseFloat(balance);
      if (isNaN(parsedBalance)) {
        errors.balance = "Balance must be a valid number.";
      } else if (parsedBalance < 0) {
        errors.balance = "Opening balance cannot be negative.";
      }
    }

    if (description && description.length > 1000) {
      errors.description = "Description must be 1000 characters or less.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGeneralError(null);

    try {
      if (isEditMode && account) {
        const response = await accountsClient.updateAccount(account.id, {
          name: name.trim(),
          type,
          description: description.trim() || null,
        });
        if (response.success) {
          onSubmitSuccess();
          onClose();
        }
      } else {
        const response = await accountsClient.createAccount({
          name: name.trim(),
          type,
          balance: parseFloat(balance) || 0,
          description: description.trim() || null,
        });
        if (response.success) {
          onSubmitSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      console.error("Account Form Submit Error:", err);
      setGeneralError(
        err?.message || "An unexpected error occurred while saving the account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Financial Account" : "Add Financial Account"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-danger/10 border border-danger/25 text-danger rounded-md text-xs font-semibold">
            {generalError}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-secondary-text">
            Account Name <span className="text-danger">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Petty Cash, ICICI Bank, Receivable Account"
            disabled={loading}
          />
          {fieldErrors.name && (
            <p className="text-xs text-danger font-semibold mt-0.5">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-secondary-text">
            Account Type <span className="text-danger">*</span>
          </label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            disabled={loading}
          >
            <option value="CASH">CASH</option>
            <option value="BANK">BANK</option>
            <option value="RECEIVABLE">RECEIVABLE</option>
            <option value="REVENUE">REVENUE</option>
            <option value="EXPENSE">EXPENSE</option>
          </Select>
        </div>

        {!isEditMode && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-secondary-text">
              Opening Balance <span className="text-danger">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="e.g. 50000"
              disabled={loading}
            />
            {fieldErrors.balance && (
              <p className="text-xs text-danger font-semibold mt-0.5">{fieldErrors.balance}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-secondary-text">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context or account details (e.g. account numbers, locations)"
            disabled={loading}
            rows={3}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-colors"
          />
          {fieldErrors.description && (
            <p className="text-xs text-danger font-semibold mt-0.5">{fieldErrors.description}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Account"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
