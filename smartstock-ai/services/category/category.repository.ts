import { query } from "@/lib/db";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category/category.types";

export async function getCategoryById(id: string, includeDeleted: boolean = false): Promise<Category | null> {
  const sql = `
    SELECT id, name, description, created_by, deleted_at, created_at, updated_at
    FROM categories
    WHERE id = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
  `;
  const result = await query<Category>(sql, [id]);
  return result.rows[0] || null;
}

export async function getCategories(includeDeleted: boolean = false): Promise<Category[]> {
  const sql = `
    SELECT id, name, description, created_by, deleted_at, created_at, updated_at
    FROM categories
    ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
    ORDER BY name ASC
  `;
  const result = await query<Category>(sql);
  return result.rows;
}

export async function getCategoryByName(name: string, includeDeleted: boolean = false): Promise<Category | null> {
  const sql = `
    SELECT id, name, description, created_by, deleted_at, created_at, updated_at
    FROM categories
    WHERE name = $1 ${includeDeleted ? "" : "AND deleted_at IS NULL"}
  `;
  const result = await query<Category>(sql, [name]);
  return result.rows[0] || null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const sql = `
    INSERT INTO categories (name, description, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, name, description, created_by, deleted_at, created_at, updated_at
  `;
  const values = [
    input.name,
    input.description ?? null,
    input.created_by ?? null,
  ];
  const result = await query<Category>(sql, values);
  return result.rows[0];
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  Object.entries(input).forEach(([key, val]) => {
    if (val !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(val);
      index++;
    }
  });

  if (fields.length === 0) {
    return getCategoryById(id);
  }

  fields.push(`updated_at = now()`);
  values.push(id);

  const sql = `
    UPDATE categories
    SET ${fields.join(", ")}
    WHERE id = $${index} AND deleted_at IS NULL
    RETURNING id, name, description, created_by, deleted_at, created_at, updated_at
  `;

  const result = await query<Category>(sql, values);
  return result.rows[0] || null;
}

export async function softDeleteCategory(id: string): Promise<boolean> {
  const sql = `
    UPDATE categories
    SET deleted_at = now(), updated_at = now()
    WHERE id = $1 AND deleted_at IS NULL
  `;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function restoreCategory(id: string): Promise<boolean> {
  const sql = `
    UPDATE categories
    SET deleted_at = NULL, updated_at = now()
    WHERE id = $1 AND deleted_at IS NOT NULL
  `;
  const result = await query(sql, [id]);
  return (result.rowCount ?? 0) > 0;
}
