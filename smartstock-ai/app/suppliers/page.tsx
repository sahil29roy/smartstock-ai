"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/common/page-header";
import { SearchInput } from "@/components/common/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { suppliersClient } from "@/lib/api/suppliers.client";
import { Supplier } from "@/types/procurement/procurement.types";
import { Plus, Edit, Trash2, Eye, Truck, UserCheck, UserMinus, AlertTriangle } from "lucide-react";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Action State
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const userRole = user?.role;
  const canEdit = ["ADMIN", "ACCOUNTS"].includes(userRole || "");
  const canDelete = ["ADMIN"].includes(userRole || "");

  // Load suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await suppliersClient.getSuppliers();
      if (response.success) {
        setSuppliers(response.suppliers);
      } else {
        setError("Failed to load suppliers.");
      }
    } catch (err: any) {
      console.error("Failed loading suppliers:", err);
      setError(
        err?.message || "An unexpected error occurred while loading suppliers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Handle Form Open
  const handleOpenForm = (supplier?: Supplier) => {
    setFormError(null);
    if (supplier) {
      setSelectedSupplier(supplier);
      setFormName(supplier.name);
      setFormEmail(supplier.email);
      setFormPhone(supplier.phone || "");
      setFormAddress(supplier.address || "");
      setFormIsActive(supplier.is_active);
    } else {
      setSelectedSupplier(null);
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormAddress("");
      setFormIsActive(true);
    }
    setIsFormOpen(true);
  };

  // Submit Add/Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!formEmail.trim()) {
      setFormError("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      setFormError("Invalid email address format");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (selectedSupplier) {
        // Edit Supplier
        const response = await suppliersClient.updateSupplier(selectedSupplier.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          address: formAddress.trim() || null,
          is_active: formIsActive,
        });
        if (response.success) {
          setIsFormOpen(false);
          fetchSuppliers();
        }
      } else {
        // Add Supplier
        const response = await suppliersClient.createSupplier({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          address: formAddress.trim() || null,
          is_active: formIsActive,
        });
        if (response.success) {
          setIsFormOpen(false);
          fetchSuppliers();
        }
      }
    } catch (err: any) {
      console.error("Supplier save error:", err);
      setFormError(
        err?.message || "An error occurred while saving the supplier."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Open
  const handleOpenDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  // Submit Delete Action
  const handleDeleteSubmit = async () => {
    if (!selectedSupplier) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const response = await suppliersClient.deleteSupplier(selectedSupplier.id);
      if (response.success) {
        setIsDeleteOpen(false);
        fetchSuppliers();
      }
    } catch (err: any) {
      console.error("Supplier deletion error:", err);
      setDeleteError(
        err?.message || "An unexpected error occurred while deleting the supplier."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Client-side Filter & Search
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const term = search.toLowerCase();
      const matchSearch =
        sup.name.toLowerCase().includes(term) ||
        sup.email.toLowerCase().includes(term) ||
        (sup.phone && sup.phone.toLowerCase().includes(term)) ||
        (sup.address && sup.address.toLowerCase().includes(term));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && sup.is_active) ||
        (statusFilter === "INACTIVE" && !sup.is_active);

      return matchSearch && matchStatus;
    });
  }, [suppliers, search, statusFilter]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [suppliers]);

  // Pagination Logic
  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Suppliers"
            description="Manage vendor profiles, contact details, and procurement relationships."
            actions={
              canEdit ? (
                <Button
                  onClick={() => handleOpenForm()}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              ) : null
            }
          />

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Suppliers</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.total}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Active Suppliers</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.active}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-danger/10 text-danger rounded-lg">
                <UserMinus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Inactive Suppliers</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.inactive}</h3>
              </div>
            </Card>
          </div>

          {/* Filters Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="w-full sm:max-w-xs">
                <SearchInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suppliers..."
                  className="w-full"
                />
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingTable rows={5} cols={canEdit ? 6 : 5} />
          ) : error ? (
            <ErrorState
              title="Unable to load suppliers"
              message={error}
              onRetry={fetchSuppliers}
            />
          ) : paginatedSuppliers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No suppliers found</p>
              {search || statusFilter !== "ALL" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                  className="text-primary mt-2"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Email</TableHeaderCell>
                      <TableHeaderCell>Phone</TableHeaderCell>
                      <TableHeaderCell>Address</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-semibold text-foreground">
                          {supplier.name}
                        </TableCell>
                        <TableCell className="text-secondary-text">
                          {supplier.email}
                        </TableCell>
                        <TableCell className="text-secondary-text">
                          {supplier.phone || "-"}
                        </TableCell>
                        <TableCell className="text-secondary-text max-w-xs truncate">
                          {supplier.address || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={supplier.is_active ? "ACTIVE" : "OUT_OF_STOCK"} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/suppliers/${supplier.id}`} passHref>
                              <Button
                                variant="outline"
                                size="sm"
                                title="View Details"
                                className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenForm(supplier)}
                                title="Edit Supplier"
                                className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDelete(supplier)}
                                title="Delete Supplier"
                                className="p-1.5 h-8 border-border text-danger hover:bg-danger/10 hover:border-danger/25"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </TableContainer>
            </>
          )}

          {/* Form Modal Dialog (Add / Edit) */}
          <Dialog
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title={selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
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
                  {formSubmitting ? "Saving..." : "Save Supplier"}
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Supplier Name <span className="text-danger">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  disabled={formSubmitting}
                  error={!!formError && !formName.trim()}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Email Address <span className="text-danger">*</span>
                </label>
                <Input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. contact@acme.com"
                  type="email"
                  disabled={formSubmitting}
                  error={!!formError && !formEmail.trim()}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Phone Number
                </label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  disabled={formSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Physical Address
                </label>
                <Textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP..."
                  disabled={formSubmitting}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
                <div>
                  <p className="text-xs font-bold text-foreground">Active Supplier</p>
                  <p className="text-[10px] text-secondary-text">Inactive suppliers cannot be used on new Purchase Orders.</p>
                </div>
                <Switch
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  disabled={formSubmitting}
                />
              </div>
            </form>
          </Dialog>

          {/* Delete Confirmation Modal Dialog */}
          <Dialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            title="Delete Supplier"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={deleteSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSubmit}
                  disabled={deleteSubmitting}
                >
                  {deleteSubmitting ? "Deleting..." : "Delete Supplier"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {deleteError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Failed to delete supplier</div>
                    <div>{deleteError}</div>
                  </div>
                </div>
              )}

              <p className="text-sm text-foreground">
                Are you sure you want to delete the supplier{" "}
                <span className="font-bold">"{selectedSupplier?.name}"</span>?
              </p>

              <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This operation will permanently delete this supplier from the system. If they have existing purchase orders, the backend may restrict this action.
                </span>
              </div>
            </div>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
