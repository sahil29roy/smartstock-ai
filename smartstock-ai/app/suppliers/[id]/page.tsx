"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { suppliersClient } from "@/lib/api/suppliers.client";
import { purchasesClient } from "@/lib/api/purchases.client";
import { Supplier, Purchase } from "@/types/procurement/procurement.types";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, ShoppingBag } from "lucide-react";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplierDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [supplierRes, purchasesRes] = await Promise.all([
        suppliersClient.getSupplierById(id),
        purchasesClient.getPurchases({ supplierId: id }),
      ]);

      if (supplierRes.success) {
        setSupplier(supplierRes.supplier);
      } else {
        setError("Supplier not found.");
      }

      if (purchasesRes.success) {
        setPurchases(purchasesRes.purchases);
      }
    } catch (err: any) {
      console.error("Error loading supplier details:", err);
      setError(
        err?.message || "An unexpected error occurred while loading supplier details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
    }
  }, [id, fetchSupplierDetails]);

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="mb-6">
              <div className="h-6 w-24 bg-surface border border-border rounded animate-pulse mb-4" />
              <div className="h-10 w-64 bg-surface border border-border rounded animate-pulse" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1 h-80 bg-surface border border-border rounded-lg animate-pulse" />
              <div className="md:col-span-2 h-80 bg-surface border border-border rounded-lg animate-pulse" />
            </div>
          </PageContainer>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !supplier) {
    return (
      <ProtectedRoute>
        <AppShell>
          <PageContainer>
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/suppliers")}
                className="flex items-center gap-1.5 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Suppliers
              </Button>
            </div>
            <ErrorState
              title="Supplier details unavailable"
              message={error || "Supplier profile not found."}
              onRetry={fetchSupplierDetails}
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
            <Link href="/suppliers" passHref>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground hover:bg-background border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Suppliers
              </Button>
            </Link>
          </div>

          <PageHeader
            title={supplier.name}
            description="Supplier overview, contact details, and purchase history."
            actions={
              <StatusBadge status={supplier.is_active ? "ACTIVE" : "OUT_OF_STOCK"} />
            }
          />

          <div className="grid gap-6 md:grid-cols-3">
            {/* Info Panel */}
            <div className="md:col-span-1 space-y-4">
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Contact Details</h3>
                
                <div className="flex items-start gap-3 text-xs">
                  <Mail className="h-4 w-4 text-secondary-text shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-secondary-text">Email Address</p>
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline font-medium break-all">{supplier.email}</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <Phone className="h-4 w-4 text-secondary-text shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-secondary-text">Phone Number</p>
                    <p className="text-foreground font-medium">{supplier.phone || "No phone provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <MapPin className="h-4 w-4 text-secondary-text shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-secondary-text">Address</p>
                    <p className="text-foreground font-medium whitespace-pre-wrap">{supplier.address || "No address provided"}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">System Audit</h3>

                <div className="flex items-center gap-3 text-xs">
                  <Calendar className="h-4 w-4 text-secondary-text" />
                  <div>
                    <p className="font-bold text-secondary-text">Created On</p>
                    <p className="text-foreground font-medium">{new Date(supplier.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <Clock className="h-4 w-4 text-secondary-text" />
                  <div>
                    <p className="font-bold text-secondary-text">Last Updated</p>
                    <p className="text-foreground font-medium">{new Date(supplier.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Purchase Orders Table */}
            <div className="md:col-span-2">
              <Card className="p-5 bg-surface border border-border rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Purchase Order History
                  </h3>
                  <span className="text-xs bg-primary-very-light dark:bg-primary-light/10 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary-light/20">
                    {purchases.length} Orders
                  </span>
                </div>

                {purchases.length === 0 ? (
                  <div className="text-center py-12 text-secondary-text text-xs">
                    No purchase orders recorded for this supplier.
                  </div>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow hoverable={false}>
                          <TableHeaderCell>Order ID</TableHeaderCell>
                          <TableHeaderCell>Date</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                          <TableHeaderCell className="text-right">Total Amount</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell className="font-semibold text-primary hover:underline">
                              <Link href={`/purchases/${purchase.id}`}>
                                {purchase.id.substring(0, 8)}...
                              </Link>
                            </TableCell>
                            <TableCell className="text-secondary-text">
                              {new Date(purchase.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={purchase.status} />
                            </TableCell>
                            <TableCell className="text-right font-semibold text-foreground">
                              ${purchase.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
