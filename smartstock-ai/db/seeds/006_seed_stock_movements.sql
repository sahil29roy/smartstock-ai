-- Seed Stock Movements (Idempotent)

-- 1. iPhone 15 Pro
INSERT INTO stock_movements (product_id, quantity, type, reason, created_by)
SELECT 
  id, 
  25, 
  'IN', 
  'Initial inventory seed', 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
FROM products 
WHERE sku = 'APPL-IPH15P-128'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements WHERE product_id = products.id AND reason = 'Initial inventory seed'
  );

-- 2. Organic Whole Milk
INSERT INTO stock_movements (product_id, quantity, type, reason, created_by)
SELECT 
  id, 
  120, 
  'IN', 
  'Initial inventory seed', 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
FROM products 
WHERE sku = 'DAIRY-MILK-1L'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements WHERE product_id = products.id AND reason = 'Initial inventory seed'
  );

-- 3. Standard Notebook A5
INSERT INTO stock_movements (product_id, quantity, type, reason, created_by)
SELECT 
  id, 
  85, 
  'IN', 
  'Initial inventory seed', 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
FROM products 
WHERE sku = 'STAT-NOTE-A5'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements WHERE product_id = products.id AND reason = 'Initial inventory seed'
  );

-- 4. Ergonomic Office Chair
INSERT INTO stock_movements (product_id, quantity, type, reason, created_by)
SELECT 
  id, 
  8, 
  'IN', 
  'Initial inventory seed', 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
FROM products 
WHERE sku = 'FURN-ERGCH-01'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements WHERE product_id = products.id AND reason = 'Initial inventory seed'
  );

-- 5. Heavy Duty Hammer
INSERT INTO stock_movements (product_id, quantity, type, reason, created_by)
SELECT 
  id, 
  40, 
  'IN', 
  'Initial inventory seed', 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
FROM products 
WHERE sku = 'HARD-HAMR-16OZ'
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements WHERE product_id = products.id AND reason = 'Initial inventory seed'
  );
