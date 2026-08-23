-- Payment 1: Full Payment for Sale 1 (Globex)
INSERT INTO payments (id, sale_id, account_id, amount, payment_method, status, created_by)
SELECT
  'd1111111-1111-1111-1111-111111111111'::UUID,
  'a1111111-1111-1111-1111-111111111111'::UUID,
  'c2222222-2222-2222-2222-222222222222'::UUID, -- Bank Account
  272.49,
  'BANK_TRANSFER',
  'COMPLETED',
  u.id
FROM users u
WHERE u.email = 'admin@smartstock.local'
  AND EXISTS (SELECT 1 FROM sales WHERE id = 'a1111111-1111-1111-1111-111111111111')
  AND NOT EXISTS (SELECT 1 FROM payments WHERE id = 'd1111111-1111-1111-1111-111111111111');

-- Payment 2: Partial Payment ($500.00 of $999.00) for Sale 2 (Jane Doe)
INSERT INTO payments (id, sale_id, account_id, amount, payment_method, status, created_by)
SELECT
  'e2222222-2222-2222-2222-222222222222'::UUID,
  'b2222222-2222-2222-2222-222222222222'::UUID,
  'c2222222-2222-2222-2222-222222222222'::UUID, -- Bank Account
  500.00,
  'CARD',
  'COMPLETED',
  u.id
FROM users u
WHERE u.email = 'sales@smartstock.local'
  AND EXISTS (SELECT 1 FROM sales WHERE id = 'b2222222-2222-2222-2222-222222222222')
  AND NOT EXISTS (SELECT 1 FROM payments WHERE id = 'e2222222-2222-2222-2222-222222222222');
