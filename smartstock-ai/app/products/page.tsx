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
  TablePagination,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingTable } from "@/components/feedback/loading-state";
import { productsClient } from "@/lib/products.client";
import { categoriesClient } from "@/lib/categories.client";
import { Product } from "@/types/product/product.types";
import { Category } from "@/types/category/category.types";
import { Plus, Edit, Trash2, RotateCcw, AlertTriangle } from "lucide-react";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formMinStock, setFormMinStock] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Action State
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Check editing privileges based on role
  const userRole = user?.role;
  const canEdit = ["ADMIN", "WAREHOUSE", "MANAGER"].includes(userRole || "");

  // Category mapping map (ID -> Name)
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load all categories for filtering & mapping
  const loadCategories = useCallback(async () => {
    try {
      // Include deleted categories to resolve names for historical/deleted products
      const response = await categoriesClient.getCategories(true);
      if (response.success) {
        setCategories(response.categories);
        const mapping: Record<string, string> = {};
        response.categories.forEach((cat) => {
          mapping[cat.id] = cat.name;
        });
        setCategoryMap(mapping);
      }
    } catch (err) {
      console.error("Failed loading categories for mapping:", err);
    }
  }, []);

  // Load products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsClient.getProducts({
        categoryId: selectedCategoryId || undefined,
        search: debouncedSearch.trim() || undefined,
        includeDeleted,
      });
      if (response.success) {
        setProducts(response.products);
      } else {
        setError("Failed to load products.");
      }
    } catch (err: unknown) {
      console.error("Failed loading products:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading products."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, debouncedSearch, includeDeleted]);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Form Open
  const handleOpenForm = (product?: Product) => {
    setFormError(null);
    if (product) {
      setSelectedProduct(product);
      setFormName(product.name);
      setFormSku(product.sku);
      setFormCategoryId(product.category_id);
      setFormPrice(product.price.toString());
      setFormMinStock(product.minimum_stock.toString());
      setFormLocation(product.location || "");
      setFormDescription(product.description || "");
    } else {
      setSelectedProduct(null);
      setFormName("");
      setFormSku("");
      // Default to first active category if available
      const activeCats = categories.filter((c) => !c.deleted_at);
      setFormCategoryId(activeCats.length > 0 ? activeCats[0].id : "");
      setFormPrice("");
      setFormMinStock("0");
      setFormLocation("");
      setFormDescription("");
    }
    setIsFormOpen(true);
  };

  // Submit Add/Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formName.trim()) return setFormError("Product Name is required");
    if (!formSku.trim()) return setFormError("SKU is required");
    if (!formCategoryId) return setFormError("Category is required");
    if (!formPrice.trim() || isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      return setFormError("Price must be a non-negative number");
    }
    if (formMinStock.trim() && (isNaN(Number(formMinStock)) || Number(formMinStock) < 0)) {
      return setFormError("Minimum stock must be a non-negative number");
    }

    setFormSubmitting(true);
    setFormError(null);

    const inputData = {
      name: formName.trim(),
      sku: formSku.trim(),
      category_id: formCategoryId,
      price: Number(formPrice),
      minimum_stock: formMinStock.trim() ? Math.floor(Number(formMinStock)) : 0,
      location: formLocation.trim() || null,
      description: formDescription.trim() || null,
    };

    try {
      if (selectedProduct) {
        // Edit Product
        const response = await productsClient.updateProduct(selectedProduct.id, inputData);
        if (response.success) {
          setIsFormOpen(false);
          fetchProducts();
        }
      } else {
        // Add Product
        const response = await productsClient.createProduct(inputData);
        if (response.success) {
          setIsFormOpen(false);
          fetchProducts();
        }
      }
    } catch (err: unknown) {
      console.error("Product save error:", err);
      setFormError(
        err instanceof Error ? err.message : "An error occurred while saving the product."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Open
  const handleOpenDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  // Submit Delete Action
  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;

    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const response = await productsClient.deleteProduct(selectedProduct.id);
      if (response.success) {
        setIsDeleteOpen(false);
        fetchProducts();
      }
    } catch (err: unknown) {
      console.error("Product deletion error:", err);
      setDeleteError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while deleting the product."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Handle Restore Product
  const handleRestore = async (product: Product) => {
    if (!confirm(`Are you sure you want to restore "${product.name}"?`)) {
      return;
    }

    try {
      const response = await productsClient.restoreProduct(product.id);
      if (response.success) {
        fetchProducts();
      }
    } catch (err: unknown) {
      console.error("Product restore error:", err);
      alert(
        err instanceof Error ? err.message : "An unexpected error occurred while restoring."
      );
    }
  };

  // Format Currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Pagination Logic
  const totalItems = products.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategoryId, includeDeleted]);

  return (
    <ProtectedRoute>
      <AppShell>
        <PageContainer>
          <PageHeader
            title="Products"
            description="Manage your inventory catalog, pricing, and stock levels."
            actions={
              canEdit ? (
                <Button
                  onClick={() => handleOpenForm()}
                  className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              ) : null
            }
          />

          {/* Filter Bar */}
          <div className="grid gap-4 md:grid-cols-4 items-center mb-6">
            <div className="md:col-span-2">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full"
              />
            </div>

            <div>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full"
              >
                <option value="">All Categories</option>
                {categories
                  .filter((cat) => !cat.deleted_at)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </Select>
            </div>

            {canEdit && (
              <div className="flex justify-end">
                <label className="flex items-center gap-2 text-xs font-semibold text-secondary-text cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(e) => setIncludeDeleted(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 transition-colors cursor-pointer"
                  />
                  Include Deleted Products
                </label>
              </div>
            )}
          </div>

          {loading ? (
            <LoadingTable rows={5} cols={canEdit ? 8 : 7} />
          ) : error ? (
            <ErrorState
              title="Unable to load products"
              message={error}
              onRetry={fetchProducts}
            />
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-secondary-text">No products found</p>
              {(search || selectedCategoryId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategoryId("");
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
                      <TableHeaderCell>SKU</TableHeaderCell>
                      <TableHeaderCell>Name</TableHeaderCell>
                      <TableHeaderCell>Category</TableHeaderCell>
                      <TableHeaderCell>Price</TableHeaderCell>
                      <TableHeaderCell>Location</TableHeaderCell>
                      <TableHeaderCell>Min Stock</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      {canEdit && <TableHeaderCell className="text-right">Actions</TableHeaderCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.map((product) => {
                      const isDeleted = !!product.deleted_at;
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-xs text-secondary-text font-semibold">
                            {product.sku}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            <div>
                              <div>{product.name}</div>
                              {product.description && (
                                <div className="text-[11px] text-secondary-text font-normal max-w-xs truncate">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-secondary-text">
                            {categoryMap[product.category_id] || "Unknown Category"}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {formatPrice(product.price)}
                          </TableCell>
                          <TableCell className="text-secondary-text">
                            {product.location || "-"}
                          </TableCell>
                          <TableCell className="text-secondary-text text-center">
                            {product.minimum_stock}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={isDeleted ? "DESTRUCTIVE" : "IN_STOCK"} />
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                {isDeleted ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(product)}
                                    title="Restore Product"
                                    className="p-1.5 h-8 text-primary border-primary-light/35 hover:bg-primary-very-light"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenForm(product)}
                                      title="Edit Product"
                                      className="p-1.5 h-8 border-border text-foreground hover:bg-background"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenDelete(product)}
                                      title="Delete Product"
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
            title={selectedProduct ? "Edit Product" : "Add New Product"}
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
                  {formSubmitting ? "Saving..." : "Save Product"}
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

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Acme Wireless Mouse"
                    disabled={formSubmitting}
                    error={!!formError && !formName.trim()}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    SKU <span className="text-danger">*</span>
                  </label>
                  <Input
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. MOUSE-WRL-01"
                    disabled={formSubmitting}
                    error={!!formError && !formSku.trim()}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Category <span className="text-danger">*</span>
                  </label>
                  <Select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    disabled={formSubmitting}
                    error={!!formError && !formCategoryId}
                  >
                    <option value="" disabled>Select category</option>
                    {categories
                      .filter((cat) => !cat.deleted_at || cat.id === formCategoryId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} {cat.deleted_at ? "(Deleted)" : ""}
                        </option>
                      ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Price ($) <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="29.99"
                    disabled={formSubmitting}
                    error={!!formError && (!formPrice.trim() || isNaN(Number(formPrice)) || Number(formPrice) < 0)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Min Stock Level
                  </label>
                  <Input
                    type="number"
                    step="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="5"
                    disabled={formSubmitting}
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Warehouse Location
                  </label>
                  <Input
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Aisle 4, Shelf B"
                    disabled={formSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                  Description
                </label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide product features, dimensions, or other details..."
                  disabled={formSubmitting}
                />
              </div>
            </form>
          </Dialog>

          {/* Delete Confirmation Modal Dialog */}
          <Dialog
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            title="Delete Product"
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
                  {deleteSubmitting ? "Deleting..." : "Delete Product"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {deleteError && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-xs font-medium flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Failed to delete product</div>
                    <div>{deleteError}</div>
                  </div>
                </div>
              )}

              <p className="text-sm text-foreground">
                Are you sure you want to delete the product{" "}
                <span className="font-bold">"{selectedProduct?.name}"</span>?
              </p>

              <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-lg text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This is a soft deletion. This product will be flagged as deleted but its historical sales and inventory transactions will be preserved. You can restore it later if needed.
                </span>
              </div>
            </div>
          </Dialog>
        </PageContainer>
      </AppShell>
    </ProtectedRoute>
  );
}
