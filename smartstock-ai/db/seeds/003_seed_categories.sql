

INSERT INTO categories (name, description, created_by)
SELECT 'Electronics', 'Gadgets, components, and appliances.', id
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics');

INSERT INTO categories (name, description, created_by)
SELECT 'Groceries', 'Food items, beverages, and daily essentials.', id
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Groceries');

INSERT INTO categories (name, description, created_by)
SELECT 'Stationery', 'Office supplies, books, and writing materials.', id
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Stationery');

INSERT INTO categories (name, description, created_by)
SELECT 'Furniture', 'Office and home furniture.', id
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Furniture');

INSERT INTO categories (name, description, created_by)
SELECT 'Hardware', 'Tools, construction supplies, and equipment.', id
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Hardware');
