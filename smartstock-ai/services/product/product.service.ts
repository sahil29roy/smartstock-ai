import * as repo from "./product.repository";
import * as categoryRepo from "../category/category.repository";
import * as inventoryRepo from "../inventory/inventory.repository";
import { createProductSchema, updateProductSchema } from "@/validators/product/product.validator";
import { Product } from "@/types/product/product.types";

export async function createProduct(input: any): Promise<Product> {
  const validated = createProductSchema.parse(input);

  // Verify category exists and is active
  const category = await categoryRepo.getCategoryById(validated.category_id);
  if (!category || category.deleted_at) {
    throw new Error("Category not found or is inactive.");
  }

  // Verify SKU uniqueness (SKU has database-level UNIQUE constraint)
  const existingSku = await repo.getProductBySku(validated.sku, true);
  if (existingSku) {
    throw new Error(`Product with SKU "${validated.sku}" already exists.`);
  }

  // Verify Name uniqueness (active products)
  const existingName = await repo.getProductByName(validated.name);
  if (existingName) {
    throw new Error(`Product with name "${validated.name}" already exists.`);
  }

  return repo.withTransaction(async (client) => {
    // 1. Create the product
    const product = await repo.createProduct({
      category_id: validated.category_id,
      name: validated.name,
      sku: validated.sku,
      description: validated.description,
      price: validated.price,
      minimum_stock: validated.minimum_stock,
      created_by: input.created_by
    }, client);

    // 2. Initialize inventory record
    await inventoryRepo.createInventory({
      product_id: product.id,
      quantity: 0,
      reserved_quantity: 0,
      location: validated.location || null
    }, client);

    return product;
  });
}

export async function updateProduct(id: string, input: any): Promise<Product> {
  const validated = updateProductSchema.parse(input);

  const existingProduct = await repo.getProductById(id);
  if (!existingProduct) {
    throw new Error("Product not found.");
  }

  if (validated.category_id) {
    const category = await categoryRepo.getCategoryById(validated.category_id);
    if (!category || category.deleted_at) {
      throw new Error("Category not found or is inactive.");
    }
  }

  if (validated.sku && validated.sku !== existingProduct.sku) {
    const duplicateSku = await repo.getProductBySku(validated.sku, true);
    if (duplicateSku) {
      throw new Error(`Product with SKU "${validated.sku}" already exists.`);
    }
  }

  if (validated.name && validated.name !== existingProduct.name) {
    const duplicateName = await repo.getProductByName(validated.name);
    if (duplicateName) {
      throw new Error(`Product with name "${validated.name}" already exists.`);
    }
  }

  return repo.withTransaction(async (client) => {
    // 1. Update product table fields
    const updated = await repo.updateProduct(id, validated, client);
    if (!updated) {
      throw new Error("Failed to update product.");
    }

    // 2. Update inventory location if provided
    if (validated.location !== undefined) {
      const inv = await inventoryRepo.getInventoryByProductId(id, client);
      if (inv) {
        await inventoryRepo.updateInventory(id, { location: validated.location }, client);
      } else {
        await inventoryRepo.createInventory({
          product_id: id,
          quantity: 0,
          reserved_quantity: 0,
          location: validated.location
        }, client);
      }
      updated.location = validated.location;
    } else {
      updated.location = existingProduct.location;
    }

    return updated;
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  return repo.getProductById(id);
}

export async function getProducts(filters?: { categoryId?: string; search?: string; includeDeleted?: boolean }): Promise<Product[]> {
  return repo.getProducts(filters);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const existing = await repo.getProductById(id);
  if (!existing) {
    throw new Error("Product not found.");
  }
  return repo.softDeleteProduct(id);
}

export async function restoreProduct(id: string): Promise<boolean> {
  const existing = await repo.getProductById(id, true);
  if (!existing) {
    throw new Error("Product not found.");
  }
  if (!existing.deleted_at) {
    throw new Error("Product is not deleted.");
  }
  return repo.restoreProduct(id);
}
