import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { categoriesClient } from "@/lib/categories.client";
import { productsClient } from "@/lib/products.client";
import { Category } from "@/types/category/category.types";
import { Product } from "@/types/product/product.types";
import { Calendar, Filter, X } from "lucide-react";

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  productId?: string;
}

interface ReportFiltersProps {
  onApply: (filters: FilterParams) => void;
  onReset: () => void;
  showCategoryProduct?: boolean;
}

export const ReportFilters = ({ onApply, onReset, showCategoryProduct = false }: ReportFiltersProps) => {
  // Local filter states before user clicks Apply
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load categories & products for selection dropdowns
    const loadDropdownData = async () => {
      try {
        const catRes = await categoriesClient.getCategories();
        if (catRes.success) setCategories(catRes.categories);

        const prodRes = await productsClient.getProducts();
        if (prodRes.success) setProducts(prodRes.products);
      } catch (err) {
        console.error("Failed to load filter choices:", err);
      }
    };
    loadDropdownData();
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      categoryId: categoryId || undefined,
      productId: productId || undefined,
    });
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setCategoryId("");
    setProductId("");
    onReset();
  };

  return (
    <form onSubmit={handleApply} className="bg-surface border border-border rounded-lg p-4 space-y-4 select-none">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Category ID (only displayed when relevant) */}
        {showCategoryProduct ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Product ID (only displayed when relevant) */}
        {showCategoryProduct ? (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wider block">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-medium"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden md:block" />
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" type="button" onClick={handleReset}>
          <X className="h-3.5 w-3.5 mr-1.5" />
          Reset Filters
        </Button>
        <Button variant="primary" size="sm" type="submit">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Apply Filters
        </Button>
      </div>
    </form>
  );
};
