"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { SaleStatusBadge } from "@/components/sales/sale-status-badge";
import { SaleItemsTable } from "@/components/sales/sale-items-table";
import { SaleActions } from "@/components/sales/sale-actions";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSpinner } from "@/components/feedback/loading-state";
import { Card } from "@/components/ui/card";
import { TableContainer, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { salesClient } from "@/lib/api/sales.client";
import { customersClient } from "@/lib/api/customers.client";
import { productsClient } from "@/lib/products.client";
import { inventoryClient } from "@/lib/inventory.client";
import { accountsClient } from "@/lib/api/accounts.client";
import { challansClient } from "@/lib/api/challans.client";
import { Sale, SaleItem, Payment, Challan, ChallanItem } from "@/types/sales/sales.types";
import { Customer } from "@/types/customer/customer.types";
import { Product } from "@/types/product/product.types";
import { Account } from "@/types/accounts/accounts.types";
import { StatusBadge } from "@/components/common/status-badge";
import { ArrowLeft, User, DollarSign, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SaleDetailParams {
  params: Promise<{ id: string }>;
}

export default function SaleDetailPage({ params }: SaleDetailParams) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const { user, loading: authLoading } = useAuth();

  const [sale, setSale] = useState<(Sale & { items: SaleItem[] }) | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [challans, setChallans] = useState<(Challan & { items?: ChallanItem[] })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, { quantity: number; reserved: number }>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Allowed roles check
  const isAuthorized = React.useMemo(() => {
    if (authLoading) return true;
    return ["ADMIN", "SALES", "ACCOUNTS", "MANAGER"].includes(user?.role || "");
  }, [user, authLoading]);

  const fetchDetails = useCallback(async () => {
    if (!isAuthorized) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Sale details
      const saleResp = await salesClient.getSaleById(id);
      if (!saleResp.success) {
        throw new Error("Sale not found.");
      }
      const saleData = saleResp.sale;
      setSale(saleData);

      // 2. Fetch linked Customer details
      const custResp = await customersClient.getCustomerById(saleData.customer_id);
      if (custResp.success) {
        setCustomer(custResp.customer);
      }

      // 3. Fetch linked Payments
      const payResp = await salesClient.getPayments({ saleId: id });
      if (payResp.success) {
        setPayments(payResp.payments);
      }

      // 4. Fetch linked Challans
      const challanResp = await challansClient.getChallans({ saleId: id });
      if (challanResp.success) {
        const detailedChallans = await Promise.all(
          challanResp.challans.map(async (ch) => {
            try {
              const details = await challansClient.getChallanById(ch.id);
              return details.success ? details.challan : ch;
            } catch (err) {
              console.error("Failed to load details for challan", ch.id, err);
              return ch;
            }
          })
        );
        setChallans(detailedChallans);
      }

      // 5. Fetch all Products (to map names/SKUs)
      const prodResp = await productsClient.getProducts({ includeDeleted: true });
      if (prodResp.success) {
        setProducts(prodResp.products);
      }

      // 6. Fetch Inventory
      const invResp = await inventoryClient.getInventory();
      if (invResp.success) {
        const invMap: Record<string, { quantity: number; reserved: number }> = {};
        invResp.inventory.forEach((item) => {
          invMap[item.product_id] = {
            quantity: item.quantity,
            reserved: item.reserved_quantity,
          };
        });
        setInventoryMap(invMap);
      }

      // 7. Fetch Accounts (for payments)
      const accResp = await accountsClient.getAccounts();
      if (accResp.success) {
        setAccounts(accResp.accounts);
      }
    } catch (err: any) {
      console.error("Failed to load sale details:", err);
      setError(err.message || "Failed to load sales order details.");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthorized]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (!authLoading && !isAuthorized) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <ErrorState
              title="Access Denied"
              message="You don't have permission to perform this action."
            />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <ErrorState
              title="Sale Order Error"
              message={error}
              onRetry={() => fetchDetails()}
            />
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (loading || !sale) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="flex flex-col items-center justify-center p-12">
              <LoadingSpinner />
              <p className="text-xs text-secondary-text mt-2">Loading sales order details...</p>
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  // Calculate payment summaries
  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, sale.total_amount - totalPaid);
  const totalItemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title={`Sales Order: ${id.substring(0, 8).toUpperCase()}`}
            description={`Order Date: ${new Date(sale.created_at).toLocaleDateString()} | Outstanding: $${outstanding.toFixed(2)}`}
            actions={
              <div className="flex items-center gap-3">
                <SaleStatusBadge status={sale.status} />
                <Link href="/sales">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sales
                  </Button>
                </Link>
              </div>
            }
          />

          {/* Action Row */}
          <SaleActions
            sale={sale}
            payments={payments}
            challans={challans}
            products={products}
            inventoryMap={inventoryMap}
            accounts={accounts}
            userRole={user?.role}
            onRefresh={fetchDetails}
          />

          {/* Metrics summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Total Amount</span>
                <h3 className="text-xl font-bold text-foreground mt-1">${sale.total_amount.toFixed(2)}</h3>
              </div>
              <div className="h-9 w-9 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Paid Amount</span>
                <h3 className="text-xl font-bold text-success mt-1">${totalPaid.toFixed(2)}</h3>
              </div>
              <div className="h-9 w-9 bg-success/10 text-success rounded-lg flex items-center justify-center">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Outstanding Amount</span>
                <h3 className={`text-xl font-bold mt-1 ${outstanding > 0 ? "text-warning" : "text-success"}`}>
                  ${outstanding.toFixed(2)}
                </h3>
              </div>
              <div className="h-9 w-9 bg-warning/10 text-warning rounded-lg flex items-center justify-center">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider">Items Ordered</span>
                <h3 className="text-xl font-bold text-foreground mt-1">{totalItemsCount}</h3>
              </div>
              <div className="h-9 w-9 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg flex items-center justify-center">
                <User className="h-4.5 w-4.5" />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left side: Items & Logistics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Ordered Items</h3>
                <SaleItemsTable items={sale.items} products={products} />
              </Card>

              {/* Linked Challans */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Delivery Challans (Dispatches)</h3>
                {challans.length === 0 ? (
                  <p className="text-xs text-secondary-text py-4 text-center">No dispatches have been made for this order yet.</p>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow hoverable={false}>
                          <TableHeaderCell>Challan No.</TableHeaderCell>
                          <TableHeaderCell>Carrier Details</TableHeaderCell>
                          <TableHeaderCell>Dispatch Date</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {challans.map((ch) => (
                          <TableRow key={ch.id}>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              {ch.challan_number}
                            </TableCell>
                            <TableCell className="text-secondary-text text-xs max-w-[150px] truncate">
                              {ch.carrier_details || "-"}
                            </TableCell>
                            <TableCell className="text-secondary-text text-xs">
                              {ch.dispatch_date
                                ? new Date(ch.dispatch_date).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={ch.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/challans/${ch.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="View Challan Details"
                                  className="p-1 h-7 w-7 border-border text-foreground hover:bg-background inline-flex items-center justify-center"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </div>

            {/* Right side: Customer Profile & Financial Payments */}
            <div className="space-y-6">
              {/* Customer Card */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Customer Details</h3>
                {customer ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Full Name</span>
                      <span className="text-sm font-bold text-foreground">{customer.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Email Address</span>
                      <span className="text-foreground">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Phone Number</span>
                        <span className="text-foreground">{customer.phone}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">Billing Address</span>
                        <span className="text-foreground">{customer.address}</span>
                      </div>
                    )}
                    {customer.gst_number && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary-text tracking-wider block">GSTIN</span>
                        <span className="font-mono text-foreground font-semibold">{customer.gst_number}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-secondary-text">Loading customer details...</p>
                )}
              </Card>

              {/* Payments History */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Payment Log</h3>
                {payments.length === 0 ? (
                  <p className="text-xs text-secondary-text py-4 text-center">No payment entries found for this order.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((pay) => (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-border bg-background/50 dark:bg-background/20"
                      >
                        <div className="text-xs">
                          <span className="font-semibold text-foreground block">
                            ${pay.amount.toFixed(2)}
                          </span>
                          <span className="text-secondary-text text-[10px]">
                            {pay.payment_method} • {new Date(pay.payment_date).toLocaleDateString()}
                          </span>
                        </div>
                        <StatusBadge status={pay.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
