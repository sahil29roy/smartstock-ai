export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  gst_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
  deleted_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  gst_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  gst_number?: string | null;
  notes?: string | null;
}
