-- Seed Products (Idempotent)

-- 1. iPhone 15 Pro (Electronics)
INSERT INTO products (name, sku, description, price, minimum_stock, category_id, created_by)
SELECT 
  'iPhone 15 Pro', 
  'APPL-IPH15P-128', 
  'Apple iPhone 15 Pro 128GB, Natural Titanium', 
  999.99, 
  10, 
  (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'APPL-IPH15P-128');

-- 2. Organic Whole Milk (Groceries)
INSERT INTO products (name, sku, description, price, minimum_stock, category_id, created_by)
SELECT 
  'Organic Whole Milk', 
  'DAIRY-MILK-1L', 
  '1 Litre organic pasteurized whole milk', 
  3.49, 
  50, 
  (SELECT id FROM categories WHERE name = 'Groceries' LIMIT 1), 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DAIRY-MILK-1L');

-- 3. Standard Notebook A5 (Stationery)
INSERT INTO products (name, sku, description, price, minimum_stock, category_id, created_by)
SELECT 
  'Standard Notebook A5', 
  'STAT-NOTE-A5', 
  'A5 ruled notebook, 160 pages, hardcover', 
  4.99, 
  20, 
  (SELECT id FROM categories WHERE name = 'Stationery' LIMIT 1), 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'STAT-NOTE-A5');

-- 4. Ergonomic Office Chair (Furniture)
INSERT INTO products (name, sku, description, price, minimum_stock, category_id, created_by)
SELECT 
  'Ergonomic Office Chair', 
  'FURN-ERGCH-01', 
  'High-back ergonomic office chair with lumbar support', 
  189.50, 
  5, 
  (SELECT id FROM categories WHERE name = 'Furniture' LIMIT 1), 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'FURN-ERGCH-01');

-- 5. Heavy Duty Hammer (Hardware)
INSERT INTO products (name, sku, description, price, minimum_stock, category_id, created_by)
SELECT 
  'Heavy Duty Hammer', 
  'HARD-HAMR-16OZ', 
  '16 oz claw hammer with shock-reduction grip', 
  15.99, 
  15, 
  (SELECT id FROM categories WHERE name = 'Hardware' LIMIT 1), 
  (SELECT id FROM users WHERE email = 'admin@smartstock.local' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'HARD-HAMR-16OZ');
