-- Seed Accounts (Idempotent)

-- HDFC Checking Account
INSERT INTO accounts (id, name, type, balance, description, created_by)
SELECT
  'c3333333-3333-3333-3333-333333333333'::UUID,
  'HDFC Checking Account',
  'BANK',
  10000.00,
  'Main company checking bank account at HDFC Bank',
  id
FROM users
WHERE email = 'admin@smartstock.local'
ON CONFLICT (name) DO NOTHING;

-- Office Cash Safe
INSERT INTO accounts (id, name, type, balance, description, created_by)
SELECT
  'c4444444-4444-4444-4444-444444444444'::UUID,
  'Office Cash Safe',
  'CASH',
  500.00,
  'Physical cash drawer in main head office room',
  id
FROM users
WHERE email = 'admin@smartstock.local'
ON CONFLICT (name) DO NOTHING;
