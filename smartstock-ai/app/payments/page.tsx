"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TablePagination,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { paymentsClient } from "@/lib/api/payments.client";
import { accountsClient } from "@/lib/api/accounts.client";
import { salesClient } from "@/lib/api/sales.client";
import { purchasesClient } from "@/lib/api/purchases.client";
import { Payment, PaymentMethod, PaymentStatus } from "@/types/sales/sales.types";
import { Account } from "@/types/accounts/accounts.types";
import { Sale } from "@/types/sales/sales.types";
import { Purchase } from "@/types/procurement/procurement.types";
import { Plus, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, Search, Filter } from "lucide-react";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, INCOMING (has sale_id), OUTGOING (has purchase_id)
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Record Payment Form Fields
  const [formType, setFormType] = useState<"INCOMING" | "OUTGOING">("INCOMING");
  const [formSaleId, setFormSaleId] = useState("");
  const [formPurchaseId, setFormPurchaseId] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formMethod, setFormMethod] = useState<PaymentMethod>("CASH");
  const [formStatus, setFormStatus] = useState<PaymentStatus>("COMPLETED");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const userRole = user?.role;
  const canModify = ["ADMIN", "ACCOUNTS"].includes(userRole || "");

  // Load Initial Data
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payRes = await paymentsClient.getPayments();
      if (payRes.success) {
        setPayments(payRes.payments);
      } else {
        setError("Failed to load payment history.");
      }

      // Fetch accounts for dropdown and details
      const accRes = await accountsClient.getAccounts();
      if (accRes.success) {
        setAccounts(accRes.accounts);
      }
    } catch (err: any) {
      console.error("Failed loading payment data:", err);
      setError(err?.message || "An error occurred while loading payment transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Load Sales/Purchases on Form Open
  const loadFormDependencies = async () => {
    try {
      const salesRes = await salesClient.getSales();
      if (salesRes.success) {
        setSales(salesRes.sales);
      }
      const purchasesRes = await purchasesClient.getPurchases();
      if (purchasesRes.success) {
        setPurchases(purchasesRes.purchases);
      }
    } catch (err) {
      console.error("Failed loading transaction dependencies:", err);
    }
  };

  const handleOpenForm = () => {
    setFormType("INCOMING");
    setFormSaleId("");
    setFormPurchaseId("");
    setFormAccountId(accounts[0]?.id || "");
    setFormAmount("");
    setFormMethod("CASH");
    setFormStatus("COMPLETED");
    setFormError(null);
    loadFormDependencies();
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Please enter a valid positive payment amount");
      return;
    }

    if (formType === "INCOMING" && !formSaleId) {
      setFormError("Please associate an active customer sale");
      return;
    }

    if (formType === "OUTGOING" && !formPurchaseId) {
      setFormError("Please associate a supplier purchase order");
      return;
    }

    if (!formAccountId) {
      setFormError("Please select a target financial account");
      return;
    }

    setFormSubmitting(true);

    try {
      const response = await paymentsClient.createPayment({
        sale_id: formType === "INCOMING" ? formSaleId : undefined,
        purchase_id: formType === "OUTGOING" ? formPurchaseId : undefined,
        account_id: formAccountId,
        amount: amountNum,
        payment_method: formMethod,
        status: formStatus,
      });

      if (response.success) {
        setIsFormOpen(false);
        fetchPayments();
      }
    } catch (err: any) {
      console.error("Create payment error:", err);
      setFormError(err?.message || "Failed to record payment transaction.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Client-side filtering & search
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const isIncoming = !!pay.sale_id;
      const matchType =
        typeFilter === "ALL" ||
        (typeFilter === "INCOMING" && isIncoming) ||
        (typeFilter === "OUTGOING" && !isIncoming);

      const matchStatus =
        statusFilter === "ALL" || pay.status === statusFilter;

      const matchMethod =
        methodFilter === "ALL" || pay.payment_method === methodFilter;

      const term = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        pay.id.toLowerCase().includes(term) ||
        (pay.sale_id && pay.sale_id.toLowerCase().includes(term)) ||
        (pay.purchase_id && pay.purchase_id.toLowerCase().includes(term));

      return matchType && matchStatus && matchMethod && matchSearch;
    });
  }, [payments, typeFilter, statusFilter, methodFilter, searchQuery]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const completedPayments = payments.filter((p) => p.status === "COMPLETED");
    const incoming = completedPayments
      .filter((p) => !!p.sale_id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const outgoing = completedPayments
      .filter((p) => !!p.purchase_id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    return {
      incoming,
      outgoing,
      totalCount: payments.length,
    };
  }, [payments]);

  // Account ID to Name Mapping
  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((acc) => {
      map[acc.id] = acc.name;
    });
    return map;
  }, [accounts]);

  // Pagination Logic
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Payments & Ledger"
            description="Track customer receivables, supplier disbursements, ledger adjustments, and cash flows."
            actions={
              canModify ? (
                <Button
                  onClick={handleOpenForm}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Record Payment
                </Button>
              ) : null
            }
          />

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Incoming Revenue</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  {loading ? "..." : `₹${kpis.incoming.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-danger/10 text-danger rounded-lg">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Outgoing Expenses</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">
                  {loading ? "..." : `₹${kpis.outgoing.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Transaction Count</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.totalCount}</h3>
              </div>
            </Card>
          </div>

          {/* Filters Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="w-full sm:max-w-xs">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="ALL">All Types</option>
                  <option value="INCOMING">Incoming (Sales)</option>
                  <option value="OUTGOING">Outgoing (Purchases)</option>
                </Select>
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </Select>
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="ALL">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </Select>
              </div>
            </div>
            <div className="w-full sm:max-w-xs">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-secondary-text" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID/Order UUID..."
                  className="pl-9 w-full text-xs"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingTable rows={5} cols={6} />
          ) : error ? (
            <ErrorState
              title="Unable to load payments"
              message={error}
              onRetry={fetchPayments}
            />
          ) : paginatedPayments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No payment records found</p>
              {(statusFilter !== "ALL" || methodFilter !== "ALL" || typeFilter !== "ALL" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setMethodFilter("ALL");
                    setTypeFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="text-primary mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Date</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Order Reference</TableHeaderCell>
                      <TableHeaderCell>Account</TableHeaderCell>
                      <TableHeaderCell>Method</TableHeaderCell>
                      <TableHeaderCell>Amount</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPayments.map((pay) => {
                      const isIncoming = !!pay.sale_id;
                      return (
                        <TableRow key={pay.id}>
                          <TableCell className="text-secondary-text text-xs">
                            {new Date(pay.payment_date).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isIncoming ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                            }`}>
                              {isIncoming ? (
                                <>
                                  <ArrowUpRight className="h-3 w-3" /> Incoming
                                </>
                              ) : (
                                <>
                                  <ArrowDownLeft className="h-3 w-3" /> Outgoing
                                </>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-secondary-text font-mono text-[10px] max-w-xs truncate">
                            {isIncoming ? (
                              <Link href={`/sales/${pay.sale_id}`} className="text-primary hover:underline">
                                Sale: {pay.sale_id}
                              </Link>
                            ) : (
                              <Link href={`/purchases/${pay.purchase_id}`} className="text-primary hover:underline">
                                PO: {pay.purchase_id}
                              </Link>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground font-medium text-xs">
                            {accountMap[pay.account_id] || pay.account_id || "-"}
                          </TableCell>
                          <TableCell className="text-secondary-text font-semibold text-xs">
                            {pay.payment_method}
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            ₹{Number(pay.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pay.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </TableContainer>
            </>
          )}

          {/* Record Payment Dialog */}
          <Dialog
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title="Record New Payment Transaction"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleFormSubmit} disabled={formSubmitting}>
                  {formSubmitting ? "Recording..." : "Record Transaction"}
                </Button>
              </>
            }
          >
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Transaction Type
                  </label>
                  <Select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "INCOMING" | "OUTGOING")}
                    disabled={formSubmitting}
                  >
                    <option value="INCOMING">Incoming (Customer Sale)</option>
                    <option value="OUTGOING">Outgoing (Supplier Purchase)</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Target Financial Account
                  </label>
                  <Select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    disabled={formSubmitting}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Bal: ₹{Number(acc.balance).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {formType === "INCOMING" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Select Associated Customer Sale <span className="text-danger">*</span>
                  </label>
                  <Select
                    value={formSaleId}
                    onChange={(e) => setFormSaleId(e.target.value)}
                    disabled={formSubmitting}
                  >
                    <option value="">-- Choose Sale Order --</option>
                    {sales
                      .filter((s) => s.status !== "PAID" && s.status !== "CANCELLED")
                      .map((sale) => (
                        <option key={sale.id} value={sale.id}>
                          Order ID: {sale.id.substring(0, 8)}... - ₹{Number(sale.total_amount).toLocaleString("en-IN")} ({sale.status})
                        </option>
                      ))}
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Select Associated Supplier Purchase Order <span className="text-danger">*</span>
                  </label>
                  <Select
                    value={formPurchaseId}
                    onChange={(e) => setFormPurchaseId(e.target.value)}
                    disabled={formSubmitting}
                  >
                    <option value="">-- Choose Purchase Order --</option>
                    {purchases
                      .filter((p) => p.status !== "CANCELLED" && p.status !== "DRAFT")
                      .map((po) => (
                        <option key={po.id} value={po.id}>
                          PO ID: {po.id.substring(0, 8)}... - ₹{Number(po.total_amount).toLocaleString("en-IN")} ({po.status})
                        </option>
                      ))}
                  </Select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Amount (₹) <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={formSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Payment Method
                  </label>
                  <Select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                    disabled={formSubmitting}
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Payment Status
                  </label>
                  <Select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                    disabled={formSubmitting}
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </Select>
                </div>
              </div>
            </form>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
