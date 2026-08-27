"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { categoriesClient } from "@/lib/categories.client";
import { Category } from "@/types/category/category.types";
import { Plus, Edit, Trash2, RotateCcw, AlertTriangle } from "lucide-react";

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Action State
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Check editing privileges based on role
  const userRole = user?.role;
  const canEdit = ["ADMIN", "WAREHOUSE", "MANAGER"].includes(userRole || "");

  // Load categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoriesClient.getCategories(includeDeleted);
      if (response.success) {
        setCategories(response.categories);
      } else {
        setError("Failed to load categories.");
      }
    } catch (err: unknown) {
      console.error("Failed loading categories:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading categories."
      );
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Form Open
  const handleOpenForm = (category?: Category) => {
    setFormError(null);
    if (category) {
      setSelectedCategory(category);
      setFormName(category.name);
      setFormDescription(category.description || "");
    } else {
      setSelectedCategory(null);
      setFormName("");
      setFormDescription("");
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

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (selectedCategory) {
        // Edit Category
        const response = await categoriesClient.updateCategory(selectedCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
        if (response.success) {
          setIsFormOpen(false);
          fetchCategories();
        }
      } else {
        // Add Category
        const response = await categoriesClient.createCategory({
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
        if (response.success) {
          setIsFormOpen(false);
          fetchCategories();
        }
      }
    } catch (err: unknown) {
      console.error("Category save error:", err);
      setFormError(
        err instanceof Error ? err.message : "An error occurred while saving the category."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Open
  const handleOpenDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  // Submit Delete Action
  const handleDeleteSubmit = async () => {
    if (!selectedCategory) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const response = await categoriesClient.deleteCategory(selectedCategory.id);
      if (response.success) {
        setIsDeleteOpen(false);
        fetchCategories();
      }
    } catch (err: unknown) {
      console.error("Category deletion error:", err);
      setDeleteError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while deleting the category."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Handle Restore Category
  const handleRestore = async (category: Category) => {
    if (!confirm(`Are you sure you want to restore the category "${category.name}"?`)) {
      return;
    }

    try {
      const response = await categoriesClient.restoreCategory(category.id);
      if (response.success) {
        fetchCategories();
      }
    } catch (err: unknown) {
      console.error("Category restore error:", err);
      alert(
        err instanceof Error ? err.message : "An unexpected error occurred while restoring."
      );
    }
  };

  // Client-side Filter & Search
  const filteredCategories = categories.filter((cat) => {
    const term = search.toLowerCase();
    return (
      cat.name.toLowerCase().includes(term) ||
      (cat.description && cat.description.toLowerCase().includes(term))
    );
  });

  // Pagination Logic
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, includeDeleted]);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Categories"
            description="Organize products into categories for better inventory and sales tracking."
            actions={
              canEdit ? (
                <Button
                  onClick={() => handleOpenForm()}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              ) : null
            }
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
            <div className="w-full sm:max-w-xs">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full"
              />
            </div>

            {canEdit && (
              <label className="flex items-center gap-2 text-xs font-semibold text-secondary-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => setIncludeDeleted(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 transition-colors cursor-pointer"
                />
                Include Deleted Categories
              </label>
            )}
          </div>

          {loading ? (
            <LoadingTable rows={5} cols={canEdit ? 5 : 4} />
          ) : error ? (
            <ErrorState
              title="Unable to load categories"
              message={error}
              onRetry={fetchCategories}
            />
          ) : paginatedCategories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No categories found</p>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                  className="text-primary mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Description</TableHeaderCell>
                      <TableHeaderCell>Created At</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      {canEdit && <TableHeaderCell className="text-right">Actions</TableHeaderCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCategories.map((category) => {
                      const isDeleted = !!category.deleted_at;
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-semibold text-foreground">
                            {category.name}
                          </TableCell>
                          <TableCell className="text-secondary-text max-w-xs truncate">
                            {category.description || "-"}
                          </TableCell>
                          <TableCell className="text-secondary-text">
                            {new Date(category.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={isDeleted ? "DESTRUCTIVE" : "ACTIVE"} />
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                {isDeleted ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(category)}
                                    title="Restore Category"
                                    className="p-1.5 h-8 text-primary border-primary-light/35 hover:bg-primary-very-light"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenForm(category)}
                                      title="Edit Category"
                                      className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenDelete(category)}
                                      title="Delete Category"
                                      className="p-1.5 h-8 border-border text-danger hover:bg-danger/10 hover:border-danger/25"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
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
            title={selectedCategory ? "Edit Category" : "Add New Category"}
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
                  {formSubmitting ? "Saving..." : "Save Category"}
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
                  Name <span className="text-danger">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Electronics, Office Supplies"
                  disabled={formSubmitting}
                  error={!!formError && !formName.trim()}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Description
                </label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide a brief description of this category..."
                  disabled={formSubmitting}
                />
              </div>
            </form>
          </Dialog>

          {/* Delete Confirmation Modal Dialog */}
          <Dialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            title="Delete Category"
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
                  {deleteSubmitting ? "Deleting..." : "Delete Category"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {deleteError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Failed to delete category</div>
                    <div>{deleteError}</div>
                  </div>
                </div>
              )}

              <p className="text-sm text-foreground">
                Are you sure you want to delete the category{" "}
                <span className="font-bold">"{selectedCategory?.name}"</span>?
              </p>

              <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This is a soft deletion. You can recover this category later if needed, provided
                  no active categories take its name. Note that this category cannot be deleted if active
                  products are still linked to it.
                </span>
              </div>
            </div>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
