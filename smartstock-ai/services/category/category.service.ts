import * as repo from "./category.repository";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category/category.types";

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const existing = await repo.getCategoryByName(input.name);
  if (existing) {
    throw new Error("An active category with this name already exists.");
  }
  return repo.createCategory(input);
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const current = await repo.getCategoryById(id);
  if (!current) {
    throw new Error("Category not found.");
  }

  if (input.name && input.name !== current.name) {
    const existing = await repo.getCategoryByName(input.name);
    if (existing) {
      throw new Error("An active category with this name already exists.");
    }
  }

  const updated = await repo.updateCategory(id, input);
  if (!updated) {
    throw new Error("Failed to update category.");
  }
  return updated;
}

export async function getCategoryById(id: string): Promise<Category> {
  const category = await repo.getCategoryById(id);
  if (!category) {
    throw new Error("Category not found.");
  }
  return category;
}

export async function getCategories(includeDeleted: boolean = false): Promise<Category[]> {
  return repo.getCategories(includeDeleted);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const exists = await repo.getCategoryById(id);
  if (!exists) {
    throw new Error("Category not found.");
  }
  return repo.softDeleteCategory(id);
}

export async function restoreCategory(id: string): Promise<boolean> {
  const exists = await repo.getCategoryById(id, true);
  if (!exists) {
    throw new Error("Category not found.");
  }
  if (exists.deleted_at === null) {
    throw new Error("Category is not deleted.");
  }
  return repo.restoreCategory(id);
}
