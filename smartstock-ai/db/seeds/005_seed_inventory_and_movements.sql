-- Seed Inventory & Stock Movements (Idempotent)

-- Helper variables / queries used inside subselects

-- 1. iPhone 15 Pro
INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT 
  id, 
  25, 
  2, 
  'Aisle A, Shelf 1'
FROM products 
WHERE sku = 'APPL-IPH15P-128'
  AND NOT EXISTS (
    SELECT 1 FROM inventory WHERE product_id = products.id
  );

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
INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT 
  id, 
  120, 
  0, 
  'Fridge B'
FROM products 
WHERE sku = 'DAIRY-MILK-1L'
  AND NOT EXISTS (
    SELECT 1 FROM inventory WHERE product_id = products.id
  );

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
INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT 
  id, 
  85, 
  5, 
  'Aisle C, Shelf 4'
FROM products 
WHERE sku = 'STAT-NOTE-A5'
  AND NOT EXISTS (
    SELECT 1 FROM inventory WHERE product_id = products.id
  );

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
INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT 
  id, 
  8, 
  1, 
  'Bulky Area D, Row 2'
FROM products 
WHERE sku = 'FURN-ERGCH-01'
  AND NOT EXISTS (
    SELECT 1 FROM inventory WHERE product_id = products.id
  );

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
INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT 
  id, 
  40, 
  0, 
  'Aisle E, Bin 12'
FROM products 
WHERE sku = 'HARD-HAMR-16OZ'
  AND NOT EXISTS (
    SELECT 1 FROM inventory WHERE product_id = products.id
  );

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
