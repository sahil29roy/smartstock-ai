-- Seed: 011_seed_procurement
-- Description: Seed initial suppliers for development

INSERT INTO suppliers (name, email, phone, address, is_active, created_by)
SELECT
  'Global Technologies Inc',
  'sales@globaltech.com',
  '+1-555-0199',
  '100 Silicon Valley Way, San Jose, CA',
  true,
  id
FROM users
WHERE email = 'admin@smartstock.local'
ON CONFLICT (name) WHERE deleted_at IS NULL DO NOTHING;

INSERT INTO suppliers (name, email, phone, address, is_active, created_by)
SELECT
  'Indus Spares Corp',
  'info@indusspares.in',
  '+91-22-5550188',
  '404 MIDC Industrial Area, Andheri East, Mumbai, MH',
  true,
  id
FROM users
WHERE email = 'admin@smartstock.local'
ON CONFLICT (name) WHERE deleted_at IS NULL DO NOTHING;
