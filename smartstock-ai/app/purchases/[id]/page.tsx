"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { purchasesClient } from "@/lib/api/purchases.client";
import { suppliersClient } from "@/lib/api/suppliers.client";
import { productsClient } from "@/lib/products.client";
import { accountsClient } from "@/lib/api/accounts.client";
import { goodsReceiptsClient } from "@/lib/api/goods-receipts.client";
import { Purchase, PurchaseItem, Supplier } from "@/types/procurement/procurement.types";
import { Product } from "@/types/product/product.types";
import { Payment } from "@/types/sales/sales.types";
import { Account } from "@/types/accounts/accounts.types";
import {
  ArrowLeft,
  DollarSign,
  Truck,
  Check,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  Play,
  FileCheck2,
} from "lucide-react";

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuth();
  const userRole = user?.role;

  const [purchase, setPurchase] = useState<(Purchase & { items: PurchaseItem[] }) | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Dialogs state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // Payment Form Fields
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "UPI">("BANK_TRANSFER");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Goods Receipt Form Fields
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>({});
  const [carrierDetails, setCarrierDetails] = useState("");
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);

  // Fetch all details
  const fetchPurchaseDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [purchaseRes, productsRes, accountsRes] = await Promise.all([
        purchasesClient.getPurchaseById(id),
        productsClient.getProducts(),
        accountsClient.getAccounts().catch(() => ({ success: true, accounts: [] })), // fail-safe if accounts endpoint fails
      ]);

      if (purchaseRes.success) {
        setPurchase(purchaseRes.purchase);
        
        // Fetch supplier details
        const supplierRes = await suppliersClient.getSupplierById(purchaseRes.purchase.supplier_id);
        if (supplierRes.success) {
          setSupplier(supplierRes.supplier);
        }

        // Fetch payments made for this PO
        const paymentsRes = await purchasesClient.getPaymentsByPurchaseId(id);
        if (paymentsRes.success) {
          setPayments(paymentsRes.payments);
        }
      } else {
        setError("Purchase order not found.");
      }

      if (productsRes.success) {
        setProducts(productsRes.products);
      }

      if (accountsRes.success) {
        setAccounts(accountsRes.accounts);
      }
    } catch (err: any) {
      console.error("Error loading purchase details:", err);
      setError(
        err?.message || "An unexpected error occurred while loading purchase details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPurchaseDetails();
    }
  }, [id, fetchPurchaseDetails]);

  // Product mapping
  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  // Compute payment details
  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const outstandingBalance = useMemo(() => {
    if (!purchase) return 0;
    return Math.max(0, purchase.total_amount - totalPaid);
  }, [purchase, totalPaid]);

  // Open Dialogs
  const handleOpenPayment = () => {
    setPaymentAmount(parseFloat(outstandingBalance.toFixed(2)));
    setPaymentMethod("BANK_TRANSFER");
    setSelectedAccountId("");
    setPaymentError(null);
    setIsPaymentOpen(true);
  };

  const handleOpenReceipt = () => {
    if (!purchase) return;
    const initialQtys: Record<string, number> = {};
    purchase.items.forEach((item) => {
      const remaining = item.quantity - item.received_quantity;
      initialQtys[item.product_id] = remaining; // default to remaining
    });
    setReceiptQuantities(initialQtys);
    setCarrierDetails("");
    setReceiptError(null);
    setIsReceiptOpen(true);
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    if (paymentAmount > outstandingBalance + 0.001) {
      setPaymentError(`Payment cannot exceed outstanding balance of $${outstandingBalance.toFixed(2)}.`);
      return;
    }

    // Verify account balance if selected
    if (selectedAccountId) {
      const acct = accounts.find((a) => a.id === selectedAccountId);
      if (acct && acct.balance < paymentAmount) {
        setPaymentError(`Selected account has insufficient balance ($${acct.balance.toFixed(2)}).`);
        return;
      }
    }

    setPaymentSubmitting(true);
    try {
      const payload = {
        purchase_id: id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        account_id: selectedAccountId || undefined,
      };

      const response = await purchasesClient.createPurchasePayment(payload);
      if (response.success) {
        setIsPaymentOpen(false);
        fetchPurchaseDetails();
      } else {
        setPaymentError("Payment submission failed.");
      }
    } catch (err: any) {
      console.error("Error creating payment:", err);
      setPaymentError(err?.message || "An unexpected error occurred.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Submit Goods Receipt
  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptError(null);

    if (!purchase) return;

    const itemsToSubmit = [];
    let hasReceivingQty = false;

    for (const item of purchase.items) {
      const qty = receiptQuantities[item.product_id] || 0;
      if (qty < 0) {
        setReceiptError("Receiving quantity cannot be negative.");
        return;
      }
      const remaining = item.quantity - item.received_quantity;
      if (qty > remaining) {
        setReceiptError(`Cannot receive more than remaining allowed (${remaining}) for product ID ${item.product_id}.`);
        return;
      }
      if (qty > 0) {
        itemsToSubmit.push({
          product_id: item.product_id,
          quantity: qty,
        });
        hasReceivingQty = true;
      }
    }

    if (!hasReceivingQty) {
      setReceiptError("Please enter a receiving quantity of at least 1 for one of the items.");
      return;
    }

    setReceiptSubmitting(true);
    try {
      const payload = {
        purchase_id: id,
        carrier_details: carrierDetails.trim() || null,
        items: itemsToSubmit,
      };

      const response = await goodsReceiptsClient.createGoodsReceipt(payload);
      if (response.success) {
        setIsReceiptOpen(false);
        fetchPurchaseDetails();
      } else {
        setReceiptError("Goods receipt submission failed.");
      }
    } catch (err: any) {
      console.error("Error creating Goods Receipt:", err);
      setReceiptError(err?.message || "An unexpected error occurred.");
    } finally {
      setReceiptSubmitting(false);
    }
  };

  // Status transitions
  const handleStatusTransition = async (newStatus: string) => {
    if (newStatus === "CANCELLED") {
      if (!confirm("Are you sure you want to cancel this purchase order? This action is permanent.")) {
        return;
      }
    }

    setIsStatusSubmitting(true);
    try {
      const response = await purchasesClient.updatePurchaseStatus(id, newStatus);
      if (response.success) {
        fetchPurchaseDetails();
      }
    } catch (err: any) {
      console.error("Status transition error:", err);
      alert(err?.message || "Failed to update status.");
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  // Role permissions checks for buttons
  const showSubmitBtn = purchase?.status === "DRAFT" && ["ADMIN", "ACCOUNTS"].includes(userRole || "");
  const showApproveBtn = purchase?.status === "SUBMITTED" && ["ADMIN", "ACCOUNTS"].includes(userRole || "");
  const showCancelBtn = ["DRAFT", "SUBMITTED", "APPROVED"].includes(purchase?.status || "") && userRole === "ADMIN";
  const showPaymentBtn = ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(purchase?.status || "") &&
    outstandingBalance > 0 &&
    ["ADMIN", "ACCOUNTS"].includes(userRole || "");
  const showReceiveBtn = ["APPROVED", "PARTIALLY_RECEIVED"].includes(purchase?.status || "") &&
    ["ADMIN", "WAREHOUSE"].includes(userRole || "");

  // Accounts options for Select
  const accountOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select account (defaults based on payment method)" }];
    accounts.forEach((a) => {
      opts.push({ value: a.id, label: `${a.name} (Balance: $${a.balance.toFixed(2)})` });
    });
    return opts;
  }, [accounts]);

  const paymentMethodOptions = [
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CASH", label: "Cash" },
    { value: "CARD", label: "Card" },
    { value: "UPI", label: "UPI" },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="h-6 w-24 bg-surface border border-border rounded animate-pulse mb-6" />
            <div className="h-12 w-64 bg-surface border border-border rounded animate-pulse mb-6" />
            <div className="space-y-6">
              <LoadingTable rows={4} cols={5} />
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !purchase) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/purchases")}
                className="flex items-center gap-1.5 text-xs border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Purchase Orders
              </Button>
            </div>
            <ErrorState
              title="Purchase order not found"
              message={error || "Purchase order sheet details unavailable."}
              onRetry={fetchPurchaseDetails}
            />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <div className="mb-6">
            <Link href="/purchases" passHref>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground hover:bg-background border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Purchase Orders
              </Button>
            </Link>
          </div>

          <PageHeader
            title={`Purchase Order: ${purchase.id.substring(0, 8)}...`}
            description="Inspect ordered quantities, fulfillments, outstanding payments, and advance status."
            actions={
              <div className="flex flex-wrap gap-2">
                {/* Status Transitions */}
                {showSubmitBtn && (
                  <Button
                    onClick={() => handleStatusTransition("SUBMITTED")}
                    disabled={isStatusSubmitting}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Submit PO
                  </Button>
                )}

                {showApproveBtn && (
                  <Button
                    onClick={() => handleStatusTransition("APPROVED")}
                    disabled={isStatusSubmitting}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Approve PO
                  </Button>
                )}

                {showReceiveBtn && (
                  <Button
                    onClick={handleOpenReceipt}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Receive Goods
                  </Button>
                )}

                {showPaymentBtn && (
                  <Button
                    onClick={handleOpenPayment}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                )}

                {showCancelBtn && (
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusTransition("CANCELLED")}
                    disabled={isStatusSubmitting}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel PO
                  </Button>
                )}

                <StatusBadge status={purchase.status} className="ml-2" />
              </div>
            }
          />

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Summary Card */}
            <div className="md:col-span-1 space-y-4">
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Supplier Profile</h3>
                {supplier ? (
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-foreground text-sm">{supplier.name}</p>
                    <p className="text-secondary-text"><span className="font-semibold text-foreground">Email:</span> {supplier.email}</p>
                    <p className="text-secondary-text"><span className="font-semibold text-foreground">Phone:</span> {supplier.phone || "-"}</p>
                    <p className="text-secondary-text"><span className="font-semibold text-foreground">Address:</span> {supplier.address || "-"}</p>
                  </div>
                ) : (
                  <p className="text-xs text-secondary-text">Loading supplier coordinates...</p>
                )}
              </Card>

              <Card className="p-5 bg-surface border border-border rounded-lg space-y-3">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Payment Audit</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-secondary-text font-semibold">Total Amount:</span>
                    <span className="font-bold text-foreground">${purchase.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span className="font-semibold">Paid Amount:</span>
                    <span className="font-bold">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-border pt-2 text-primary font-bold">
                    <span>Outstanding:</span>
                    <span>${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right details & items */}
            <div className="md:col-span-2 space-y-6">
              {/* Ordered Items Table */}
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-3">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Ordered Items</h3>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow hoverable={false}>
                        <TableHeaderCell>Product</TableHeaderCell>
                        <TableHeaderCell>SKU</TableHeaderCell>
                        <TableHeaderCell className="text-right">Ordered</TableHeaderCell>
                        <TableHeaderCell className="text-right">Received</TableHeaderCell>
                        <TableHeaderCell className="text-right">Unit Cost</TableHeaderCell>
                        <TableHeaderCell className="text-right">Subtotal</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchase.items.map((item) => {
                        const prod = productMap[item.product_id];
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-foreground">
                              {prod ? prod.name : "Loading product..."}
                            </TableCell>
                            <TableCell className="text-secondary-text">
                              {prod ? prod.sku : "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary">
                              {item.received_quantity}
                            </TableCell>
                            <TableCell className="text-right text-secondary-text">
                              ${item.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-foreground">
                              ${(item.quantity * item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>

              {/* Payments Ledger */}
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-3">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Supplier Payments Ledger</h3>
                {payments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-secondary-text">
                    No supplier payments recorded for this purchase order yet.
                  </div>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow hoverable={false}>
                          <TableHeaderCell>Payment Date</TableHeaderCell>
                          <TableHeaderCell>Method</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                          <TableHeaderCell className="text-right">Paid Amount</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((pmt) => (
                          <TableRow key={pmt.id}>
                            <TableCell className="text-secondary-text">
                              {new Date(pmt.payment_date).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-foreground font-semibold">
                              {pmt.payment_method.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={pmt.status} />
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground">
                              ${pmt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </div>
          </div>

          {/* Payment Recording Dialog */}
          <Dialog
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            title="Record Supplier Payment"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentOpen(false)}
                  disabled={paymentSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handlePaymentSubmit} disabled={paymentSubmitting}>
                  {paymentSubmitting ? "Submitting..." : "Submit Payment"}
                </Button>
              </>
            }
          >
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {paymentError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                  {paymentError}
                </div>
              )}

              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary-dark dark:text-primary rounded-lg text-xs font-medium">
                Outstanding balance to satisfy: <span className="font-bold">${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Payment Amount ($) <span className="text-danger">*</span>
                </label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  disabled={paymentSubmitting}
                  error={!!paymentError && paymentAmount <= 0}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Payment Method <span className="text-danger">*</span>
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  disabled={paymentSubmitting}
                >
                  {paymentMethodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Financial Account (Optional)
                </label>
                <Select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={paymentSubmitting}
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </form>
          </Dialog>

          {/* Goods Receipt Dialog */}
          <Dialog
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            title="Create Goods Receipt / GRN"
            size="lg"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsReceiptOpen(false)}
                  disabled={receiptSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleReceiptSubmit} disabled={receiptSubmitting}>
                  {receiptSubmitting ? "Receiving..." : "Register Goods Receipt"}
                </Button>
              </>
            }
          >
            <form onSubmit={handleReceiptSubmit} className="space-y-4">
              {receiptError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                  {receiptError}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs text-secondary-text">
                  Enter the quantity of items being received physically at the warehouse. Remaining values represent ordered minus previously received items.
                </p>

                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-background border-b border-border text-secondary-text font-bold uppercase tracking-wider">
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Ordered</th>
                        <th className="p-3 text-right">Already Received</th>
                        <th className="p-3 text-right">Remaining</th>
                        <th className="p-3 text-right w-36">Receiving Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {purchase.items.map((item) => {
                        const prod = productMap[item.product_id];
                        const remaining = item.quantity - item.received_quantity;
                        const receivingVal = receiptQuantities[item.product_id] ?? 0;

                        return (
                          <tr key={item.id} className="text-foreground">
                            <td className="p-3 font-semibold">
                              {prod ? prod.name : "Loading product..."}
                            </td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right text-success">{item.received_quantity}</td>
                            <td className="p-3 text-right font-bold text-foreground">{remaining}</td>
                            <td className="p-3 text-right">
                              <Input
                                type="number"
                                min="0"
                                max={remaining}
                                step="1"
                                value={receivingVal}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  setReceiptQuantities((prev) => ({
                                    ...prev,
                                    [item.product_id]: isNaN(val) ? 0 : val,
                                  }));
                                }}
                                disabled={remaining === 0 || receiptSubmitting}
                                className="h-8 text-right w-24 ml-auto"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Carrier & Dispatch Details
                </label>
                <Textarea
                  value={carrierDetails}
                  onChange={(e) => setCarrierDetails(e.target.value)}
                  placeholder="e.g. DHL Express, Tracking: 12345, Driver: John Doe"
                  disabled={receiptSubmitting}
                />
              </div>
            </form>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
