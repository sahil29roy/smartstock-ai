
INSERT INTO customers (name, email, phone, address, gst_number, notes, created_by)
SELECT 'Acme Corporation', 'contact@acme.com', '+15550199', '123 Industrial Way, Suite 500, Tech City', '27AAAAA1111A1Z1', 'B2B customer with active GST registration.', id
FROM users
WHERE email = 'sales@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE email = 'contact@acme.com');

-- Insert active B2C customer (Jane Doe)
INSERT INTO customers (name, email, phone, address, gst_number, notes, created_by)
SELECT 'Jane Doe', 'jane.doe@personal.me', '+15550244', '456 Residential Blvd, Suburbia', NULL, 'Individual B2C customer.', id
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE email = 'jane.doe@personal.me');

-- Insert active B2B customer 
INSERT INTO customers (name, email, phone, address, gst_number, notes, created_by)
SELECT 'Globex Corporation', 'billing@globex.corp', '+15550388', '789 Global Plaza, Metropolis', '07BBBBB2222B2Z2', 'Key corporate account.', id
FROM users
WHERE email = 'sales@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE email = 'billing@globex.corp');

-- Insert soft-deleted customer
INSERT INTO customers (name, email, phone, address, gst_number, notes, created_by, deleted_at)
SELECT 'Soft Deleted Customer', 'deleted@oldcompany.com', '+15550999', '10 Abandoned Rd, Ghost Town', NULL, 'This customer was soft-deleted.', id, now() - INTERVAL '2 days'
FROM users
WHERE email = 'admin@smartstock.local'
  AND NOT EXISTS (SELECT 1 FROM customers WHERE email = 'deleted@oldcompany.com');
