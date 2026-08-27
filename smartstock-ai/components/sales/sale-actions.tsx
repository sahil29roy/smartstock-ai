import React, { useState } from "react";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { ConfirmDialog } from "../feedback/confirm-dialog";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { CreditCard, Truck, XCircle } from "lucide-react";
import { Sale, SaleItem, Challan, ChallanItem, Payment } from "@/types/sales/sales.types";
import { Product } from "@/types/product/product.types";
import { Account } from "@/types/accounts/accounts.types";
import { UserRole } from "@/types/auth/auth.types";
import { salesClient } from "@/lib/api/sales.client";
import { challansClient } from "@/lib/api/challans.client";
import { CreateChallanForm } from "../challans/create-challan-form";

interface SaleActionsProps {
  sale: Sale & { items: SaleItem[] };
  payments: Payment[];
  challans: (Challan & { items?: ChallanItem[] })[];
  products: Product[];
  inventoryMap: Record<string, { quantity: number; reserved: number }>;
  accounts: Account[];
  userRole?: UserRole;
  onRefresh: () => void;
}

export const SaleActions = ({
  sale,
  payments,
  challans,
  products,
  inventoryMap,
  accounts,
  userRole,
  onRefresh,
}: SaleActionsProps) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isChallanOpen, setIsChallanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [accountId, setAccountId] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Cancellation state
  const [cancelLoading, setCancelLoading] = useState(false);

  // Role permissions
  const isAdmin = userRole === "ADMIN";
  const isAccounts = userRole === "ACCOUNTS";
  const isSales = userRole === "SALES";
  const isWarehouse = userRole === "WAREHOUSE";

  const canRegisterPayment = (isAdmin || isAccounts) && sale.status !== "CANCELLED" && sale.status !== "PAID";
  const canDispatchChallan = (isAdmin || isWarehouse || isSales) && sale.status !== "CANCELLED";
  const canCancelOrder = (isAdmin || isSales) && (sale.status === "PENDING" || sale.status === "PARTIALLY_PAID");

  // Calculate unpaid balance
  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, sale.total_amount - totalPaid);

  // Open Payment Dialog and pre-populate
  const handleOpenPayment = () => {
    setPaymentAmount(outstanding);
    setPaymentMethod("CASH");
    if (accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
    setPaymentError(null);
    setIsPaymentOpen(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentAmount <= 0) {
      setPaymentError("Payment amount must be a positive number.");
      return;
    }
    if (!accountId) {
      setPaymentError("Please select a financial account.");
      return;
    }

    try {
      setPaymentLoading(true);
      await salesClient.createPayment({
        sale_id: sale.id,
        account_id: accountId,
        amount: paymentAmount,
        payment_method: paymentMethod as any,
        status: "COMPLETED",
      });
      setIsPaymentOpen(false);
      onRefresh();
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCreateChallanSubmit = async (payload: any) => {
    await challansClient.createChallan(payload);
    setIsChallanOpen(false);
    onRefresh();
  };

  const handleCancelConfirm = async () => {
    try {
      setCancelLoading(true);
      await salesClient.updateSaleStatus(sale.id, "CANCELLED");
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to cancel order.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (!canRegisterPayment && !canDispatchChallan && !canCancelOrder) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {canRegisterPayment && (
        <Button
          onClick={handleOpenPayment}
          className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-white"
        >
          <CreditCard className="h-4 w-4" />
          Register Payment
        </Button>
      )}

      {canDispatchChallan && (
        <Button
          onClick={() => setIsChallanOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Truck className="h-4 w-4" />
          Dispatch items
        </Button>
      )}

      {canCancelOrder && (
        <Button
          variant="destructive"
          onClick={() => setIsCancelOpen(true)}
          className="flex items-center gap-1.5"
        >
          <XCircle className="h-4 w-4" />
          Cancel Order
        </Button>
      )}

      {/* Register Payment Dialog */}
      <Dialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Record Payment"
        size="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentOpen(false)}
              disabled={paymentLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegisterPayment}
              size="sm"
              className="bg-success hover:bg-success/90 text-white"
              disabled={paymentLoading}
            >
              {paymentLoading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          {paymentError && (
            <div className="p-2.5 bg-danger/10 text-danger border border-danger/25 rounded-lg text-xs font-semibold">
              {paymentError}
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
              Outstanding Balance ($)
            </label>
            <div className="h-9 px-3 border border-border bg-surface rounded-lg flex items-center font-bold text-foreground text-sm">
              ${outstanding.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
              Payment Amount ($) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={outstanding}
              value={paymentAmount || ""}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
              Payment Method *
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </Select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block mb-1">
              Deposit Account *
            </label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full"
              required
            >
              <option value="">Select Account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </Select>
          </div>
        </form>
      </Dialog>

      {/* Dispatch items Dialog */}
      <Dialog
        isOpen={isChallanOpen}
        onClose={() => setIsChallanOpen(false)}
        title="Create Delivery Challan"
        size="lg"
      >
        <CreateChallanForm
          sale={sale}
          challans={challans}
          products={products}
          inventoryMap={inventoryMap}
          onSubmit={handleCreateChallanSubmit}
          onClose={() => setIsChallanOpen(false)}
        />
      </Dialog>

      {/* Cancel Order Confirmation */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Sales Order"
        message="Are you sure you want to cancel this sales order? Canceling this order will release all reserved inventory quantities back to physical stock. This action cannot be undone."
        confirmLabel={cancelLoading ? "Canceling..." : "Cancel Order"}
        variant="destructive"
      />
    </div>
  );
};
