-- Challan 1: Fully Delivered for Sale 1 (Globex)
INSERT INTO challans (id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by)
SELECT
  'f1111111-1111-1111-1111-111111111111'::UUID,
  'CH-202608-0001',
  'a1111111-1111-1111-1111-111111111111'::UUID,
  'DELIVERED',
  now() - INTERVAL '1 day',
  'DHL Express - Tracking Ref: DHL987654',
  u.id
FROM users u
WHERE u.email = 'warehouse@smartstock.local'
  AND EXISTS (SELECT 1 FROM sales WHERE id = 'a1111111-1111-1111-1111-111111111111')
  AND NOT EXISTS (SELECT 1 FROM challans WHERE id = 'f1111111-1111-1111-1111-111111111111');

-- Challan 1 Items: 1 Ergonomic Office Chair, 5 Notebook A5
INSERT INTO challan_items (challan_id, product_id, quantity)
SELECT
  'f1111111-1111-1111-1111-111111111111'::UUID,
  p.id,
  1
FROM products p
WHERE p.sku = 'FURN-ERGCH-01'
  AND EXISTS (SELECT 1 FROM challans WHERE id = 'f1111111-1111-1111-1111-111111111111')
  AND NOT EXISTS (
    SELECT 1 FROM challan_items 
    WHERE challan_id = 'f1111111-1111-1111-1111-111111111111' 
      AND product_id = p.id
  );

INSERT INTO challan_items (challan_id, product_id, quantity)
SELECT
  'f1111111-1111-1111-1111-111111111111'::UUID,
  p.id,
  5
FROM products p
WHERE p.sku = 'STAT-NOTE-A5'
  AND EXISTS (SELECT 1 FROM challans WHERE id = 'f1111111-1111-1111-1111-111111111111')
  AND NOT EXISTS (
    SELECT 1 FROM challan_items 
    WHERE challan_id = 'f1111111-1111-1111-1111-111111111111' 
      AND product_id = p.id
  );


-- Challan 2: Dispatched for Sale 2 (Jane Doe)
INSERT INTO challans (id, challan_number, sale_id, status, dispatch_date, carrier_details, created_by)
SELECT
  'f2222222-2222-2222-2222-222222222222'::UUID,
  'CH-202608-0002',
  'b2222222-2222-2222-2222-222222222222'::UUID,
  'DISPATCHED',
  now(),
  'Local Delivery Van #3 - Driver: John',
  u.id
FROM users u
WHERE u.email = 'warehouse@smartstock.local'
  AND EXISTS (SELECT 1 FROM sales WHERE id = 'b2222222-2222-2222-2222-222222222222')
  AND NOT EXISTS (SELECT 1 FROM challans WHERE id = 'f2222222-2222-2222-2222-222222222222');

-- Challan 2 Items: 1 iPhone 15 Pro
INSERT INTO challan_items (challan_id, product_id, quantity)
SELECT
  'f2222222-2222-2222-2222-222222222222'::UUID,
  p.id,
  1
FROM products p
WHERE p.sku = 'APPL-IPH15P-128'
  AND EXISTS (SELECT 1 FROM challans WHERE id = 'f2222222-2222-2222-2222-222222222222')
  AND NOT EXISTS (
    SELECT 1 FROM challan_items 
    WHERE challan_id = 'f2222222-2222-2222-2222-222222222222' 
      AND product_id = p.id
  );
