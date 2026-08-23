export interface Category {
  id: string;
  name: string;
  description?: string | null;
  created_by?: string | null;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  created_by?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
}
