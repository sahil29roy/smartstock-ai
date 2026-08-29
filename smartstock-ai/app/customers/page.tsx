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
import { customersClient } from "@/lib/api/customers.client";
import { Customer } from "@/types/customer/customer.types";
import { Plus, Edit, Trash2, Users, UserCheck, Building, AlertTriangle } from "lucide-react";

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, B2B (has GST), B2C (no GST)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formGstNumber, setFormGstNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Action State
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const userRole = user?.role;
  const canEdit = ["ADMIN", "SALES"].includes(userRole || "");
  const canDelete = ["ADMIN"].includes(userRole || "");

  // Load customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both active and soft-deleted for management if admin, otherwise active only
      const response = await customersClient.getCustomers(true);
      if (response.success) {
        setCustomers(response.customers);
      } else {
        setError("Failed to load customers.");
      }
    } catch (err: any) {
      console.error("Failed loading customers:", err);
      setError(
        err?.message || "An unexpected error occurred while loading customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle Form Open
  const handleOpenForm = (customer?: Customer) => {
    setFormError(null);
    if (customer) {
      setSelectedCustomer(customer);
      setFormName(customer.name);
      setFormEmail(customer.email);
      setFormPhone(customer.phone || "");
      setFormAddress(customer.address || "");
      setFormGstNumber(customer.gst_number || "");
      setFormNotes(customer.notes || "");
    } else {
      setSelectedCustomer(null);
      setFormName("");
      setFormEmail("");
      setFormPhone("");
      setFormAddress("");
      setFormGstNumber("");
      setFormNotes("");
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
      if (selectedCustomer) {
        // Edit Customer
        const response = await customersClient.updateCustomer(selectedCustomer.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          address: formAddress.trim() || null,
          gst_number: formGstNumber.trim() || null,
          notes: formNotes.trim() || null,
        });
        if (response.success) {
          setIsFormOpen(false);
          fetchCustomers();
        }
      } else {
        // Add Customer
        const response = await customersClient.createCustomer({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || null,
          address: formAddress.trim() || null,
          gst_number: formGstNumber.trim() || null,
          notes: formNotes.trim() || null,
        });
        if (response.success) {
          setIsFormOpen(false);
          fetchCustomers();
        }
      }
    } catch (err: any) {
      console.error("Customer save error:", err);
      setFormError(
        err?.message || "An error occurred while saving the customer."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Open
  const handleOpenDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  // Submit Delete Action
  const handleDeleteSubmit = async () => {
    if (!selectedCustomer) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const response = await customersClient.deleteCustomer(selectedCustomer.id);
      if (response.success) {
        setIsDeleteOpen(false);
        fetchCustomers();
      }
    } catch (err: any) {
      console.error("Customer deletion error:", err);
      setDeleteError(
        err?.message || "An unexpected error occurred while deleting the customer."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Client-side Filter & Search
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Exclude soft deleted unless admin
      if (cust.deleted_at && userRole !== "ADMIN") return false;

      const term = search.toLowerCase();
      const matchSearch =
        cust.name.toLowerCase().includes(term) ||
        cust.email.toLowerCase().includes(term) ||
        (cust.phone && cust.phone.toLowerCase().includes(term)) ||
        (cust.gst_number && cust.gst_number.toLowerCase().includes(term));

      const isB2B = !!cust.gst_number;
      const matchType =
        typeFilter === "ALL" ||
        (typeFilter === "B2B" && isB2B) ||
        (typeFilter === "B2C" && !isB2B);

      return matchSearch && matchType;
    });
  }, [customers, search, typeFilter, userRole]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const activeCustomers = customers.filter(c => !c.deleted_at);
    const total = activeCustomers.length;
    const b2b = activeCustomers.filter((c) => !!c.gst_number).length;
    const b2c = total - b2b;
    return { total, b2b, b2c };
  }, [customers]);

  // Pagination Logic
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Customers"
            description="Manage customer profiles, B2B registrations, contact details, and account histories."
            actions={
              canEdit ? (
                <Button
                  onClick={() => handleOpenForm()}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              ) : null
            }
          />

          {/* KPI Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-primary-very-light dark:bg-primary-light/10 text-primary rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Total Customers</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.total}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-success/10 text-success rounded-lg">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Corporate Accounts (B2B)</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.b2b}</h3>
              </div>
            </Card>
            <Card className="p-4 bg-surface border border-border rounded-lg flex items-center gap-4">
              <div className="p-3 bg-secondary-text/10 text-secondary-text rounded-lg">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Retail Clients (B2C)</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5">{loading ? "..." : kpis.b2c}</h3>
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
                  placeholder="Search customers..."
                  className="w-full"
                />
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="ALL">All Types</option>
                  <option value="B2B">Corporate (B2B)</option>
                  <option value="B2C">Retail (B2C)</option>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingTable rows={5} cols={canEdit ? 6 : 5} />
          ) : error ? (
            <ErrorState
              title="Unable to load customers"
              message={error}
              onRetry={fetchCustomers}
            />
          ) : paginatedCustomers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No customers found</p>
              {search || typeFilter !== "ALL" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("ALL");
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
                      <TableHeaderCell>GST Number</TableHeaderCell>
                      <TableHeaderCell>Address</TableHeaderCell>
                      <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            {customer.name}
                            {customer.deleted_at && (
                              <span className="text-[9px] bg-danger/15 text-danger px-1.5 py-0.5 rounded font-bold uppercase">Archived</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-secondary-text">
                          {customer.email}
                        </TableCell>
                        <TableCell className="text-secondary-text">
                          {customer.phone || "-"}
                        </TableCell>
                        <TableCell className="text-secondary-text font-mono text-xs">
                          {customer.gst_number ? (
                            <span className="bg-success/10 text-success px-2 py-0.5 rounded font-semibold">{customer.gst_number}</span>
                          ) : (
                            <span className="text-secondary-text/60 italic">None (B2C)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-secondary-text max-w-xs truncate">
                          {customer.address || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenForm(customer)}
                                title="Edit Customer"
                                className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && !customer.deleted_at && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDelete(customer)}
                                title="Archive/Delete Customer"
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
            title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
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
                  {formSubmitting ? "Saving..." : "Save Customer"}
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
                  Customer Name <span className="text-danger">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Corporation or Jane Doe"
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
                  placeholder="e.g. billing@company.com"
                  type="email"
                  disabled={formSubmitting}
                  error={!!formError && !formEmail.trim()}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Phone Number
                  </label>
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    disabled={formSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    GST Number (Optional)
                  </label>
                  <Input
                    value={formGstNumber}
                    onChange={(e) => setFormGstNumber(e.target.value)}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    disabled={formSubmitting}
                  />
                </div>
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Internal Notes
                </label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Special billing terms, preference, etc..."
                  disabled={formSubmitting}
                />
              </div>
            </form>
          </Dialog>

          {/* Delete Confirmation Modal Dialog */}
          <Dialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            title="Archive Customer"
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
                  {deleteSubmitting ? "Archiving..." : "Archive Customer"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {deleteError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Failed to archive customer</div>
                    <div>{deleteError}</div>
                  </div>
                </div>
              )}

              <p className="text-sm text-foreground">
                Are you sure you want to archive the customer{" "}
                <span className="font-bold">"{selectedCustomer?.name}"</span>?
              </p>

              <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This will soft-delete the customer profile. They will no longer be selectable for new Sales Orders, but historic transaction records will remain intact.
                </span>
              </div>
            </div>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
