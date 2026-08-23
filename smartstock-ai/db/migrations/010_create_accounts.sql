-- Migration: 010_create_accounts
-- Description: Create accounts table, seed default accounts, and add account_id to payments

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('CASH', 'BANK', 'RECEIVABLE', 'REVENUE', 'EXPENSE')),
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default accounts mapped to the admin user
INSERT INTO accounts (id, name, type, balance, description, created_by)
SELECT
  'c1111111-1111-1111-1111-111111111111'::UUID,
  'Cash Account',
  'CASH',
  0.00,
  'Default account for physical cash transactions',
  id
FROM users
WHERE email = 'admin@smartstock.local'
ON CONFLICT (name) DO NOTHING;

INSERT INTO accounts (id, name, type, balance, description, created_by)
SELECT
  'c2222222-2222-2222-2222-222222222222'::UUID,
  'Bank Account',
  'BANK',
  0.00,
  'Default account for bank transfers, cards and UPI',
  id
FROM users
WHERE email = 'admin@smartstock.local'
ON CONFLICT (name) DO NOTHING;

-- Add account_id column to payments with default Cash Account
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT 'c1111111-1111-1111-1111-111111111111'::UUID REFERENCES accounts(id) ON DELETE RESTRICT;

-- Re-map bank/card/upi payments to default Bank Account for correctness
UPDATE payments
SET account_id = 'c2222222-2222-2222-2222-222222222222'::UUID
WHERE payment_method IN ('BANK_TRANSFER', 'CARD', 'UPI');

-- Create index on payments(account_id)
CREATE INDEX IF NOT EXISTS idx_payments_account_id ON payments(account_id);
