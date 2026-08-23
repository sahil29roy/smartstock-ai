-- Sale 1: Globex Corporation PAID sale
INSERT INTO sales (id, customer_id, total_amount, status, created_by)
SELECT 
  'a1111111-1111-1111-1111-111111111111'::UUID,
  c.id,
  272.49,
  'PAID',
  u.id
FROM customers c, users u
WHERE c.email = 'billing@globex.corp'
  AND u.email = 'sales@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM sales WHERE id = 'a1111111-1111-1111-1111-111111111111');

-- Sale 1 Items: 1 Ergonomic Office Chair, 5 Notebook A5
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
SELECT 
  'a1111111-1111-1111-1111-111111111111'::UUID,
  p.id,
  1,
  249.99
FROM products p
WHERE p.sku = 'FURN-ERGCH-01'
  AND NOT EXISTS (
    SELECT 1 FROM sale_items 
    WHERE sale_id = 'a1111111-1111-1111-1111-111111111111' 
      AND product_id = p.id
  );

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
SELECT 
  'a1111111-1111-1111-1111-111111111111'::UUID,
  p.id,
  5,
  4.50
FROM products p
WHERE p.sku = 'STAT-NOTE-A5'
  AND NOT EXISTS (
    SELECT 1 FROM sale_items 
    WHERE sale_id = 'a1111111-1111-1111-1111-111111111111' 
      AND product_id = p.id
  );


-- Sale 2: Jane Doe PARTIALLY_PAID sale
INSERT INTO sales (id, customer_id, total_amount, status, created_by)
SELECT 
  'b2222222-2222-2222-2222-222222222222'::UUID,
  c.id,
  999.00,
  'PARTIALLY_PAID',
  u.id
FROM customers c, users u
WHERE c.email = 'jane.doe@personal.me'
  AND u.email = 'sales@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM sales WHERE id = 'b2222222-2222-2222-2222-222222222222');

-- Sale 2 Items: 1 iPhone 15 Pro
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
SELECT 
  'b2222222-2222-2222-2222-222222222222'::UUID,
  p.id,
  1,
  999.00
FROM products p
WHERE p.sku = 'APPL-IPH15P-128'
  AND NOT EXISTS (
    SELECT 1 FROM sale_items 
    WHERE sale_id = 'b2222222-2222-2222-2222-222222222222' 
      AND product_id = p.id
  );


-- Sale 3: Acme Corporation PENDING sale
INSERT INTO sales (id, customer_id, total_amount, status, created_by)
SELECT 
  'c3333333-3333-3333-3333-333333333333'::UUID,
  c.id,
  39.98,
  'PENDING',
  u.id
FROM customers c, users u
WHERE c.email = 'contact@acme.com'
  AND u.email = 'sales@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM sales WHERE id = 'c3333333-3333-3333-3333-333333333333');

-- Sale 3 Items: 2 Heavy Duty Hammers
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
SELECT 
  'c3333333-3333-3333-3333-333333333333'::UUID,
  p.id,
  2,
  19.99
FROM products p
WHERE p.sku = 'HARD-HAMR-16OZ'
  AND NOT EXISTS (
    SELECT 1 FROM sale_items 
    WHERE sale_id = 'c3333333-3333-3333-3333-333333333333' 
      AND product_id = p.id
  );
