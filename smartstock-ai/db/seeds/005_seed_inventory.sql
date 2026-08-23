-- Seed Inventory (Idempotent)

INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT id, 25, 2, 'Aisle A, Shelf 1' FROM products WHERE sku = 'APPL-IPH15P-128'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT id, 120, 0, 'Fridge B' FROM products WHERE sku = 'DAIRY-MILK-1L'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT id, 85, 5, 'Aisle C, Shelf 4' FROM products WHERE sku = 'STAT-NOTE-A5'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT id, 8, 1, 'Bulky Area D, Row 2' FROM products WHERE sku = 'FURN-ERGCH-01'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, quantity, reserved_quantity, location)
SELECT id, 40, 0, 'Aisle E, Bin 12' FROM products WHERE sku = 'HARD-HAMR-16OZ'
ON CONFLICT (product_id) DO NOTHING;
