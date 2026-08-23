export type AccountType = 'CASH' | 'BANK' | 'RECEIVABLE' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  description?: string | null;
  created_by?: string | null;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  balance?: number;
  description?: string | null;
}
