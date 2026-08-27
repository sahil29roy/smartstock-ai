import { apiClient } from "@/lib/api-client";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category/category.types";

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

export interface CategoryResponse {
  success: boolean;
  category: Category;
}

export interface DeleteCategoryResponse {
  success: boolean;
  message: string;
}

export const categoriesClient = {
  getCategories: async (includeDeleted?: boolean): Promise<CategoriesResponse> => {
    const url = `/api/categories${includeDeleted ? "?includeDeleted=true" : ""}`;
    return apiClient.get<CategoriesResponse>(url);
  },

  getCategoryById: async (id: string): Promise<CategoryResponse> => {
    return apiClient.get<CategoryResponse>(`/api/categories/${id}`);
  },

  createCategory: async (input: CreateCategoryInput): Promise<CategoryResponse> => {
    return apiClient.post<CategoryResponse>("/api/categories", input);
  },

  updateCategory: async (id: string, input: UpdateCategoryInput): Promise<CategoryResponse> => {
    return apiClient.patch<CategoryResponse>(`/api/categories/${id}`, input);
  },

  deleteCategory: async (id: string): Promise<DeleteCategoryResponse> => {
    return apiClient.delete<DeleteCategoryResponse>(`/api/categories/${id}`);
  },

  restoreCategory: async (id: string): Promise<CategoryResponse> => {
    return apiClient.patch<CategoryResponse>(`/api/categories/${id}`, { action: "restore" });
  },
};
