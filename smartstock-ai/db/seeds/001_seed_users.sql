-- Seed: 001_seed_users
-- Created: 2026-08-16
-- Description: Seed initial users for development
-- Default Password for all seeded users: password123

INSERT INTO users (name, email, password_hash, role, is_active)
VALUES
  ('Admin User', 'admin@smartstock.local', '$2b$10$dJjMFYZr2ez0LSoLssYEG.asZGu603yvkl7Sy6XHze5.WPs/lH6yq', 'ADMIN', true),
  ('Sales User', 'sales@smartstock.local', '$2b$10$dJjMFYZr2ez0LSoLssYEG.asZGu603yvkl7Sy6XHze5.WPs/lH6yq', 'SALES', true),
  ('Warehouse User', 'warehouse@smartstock.local', '$2b$10$dJjMFYZr2ez0LSoLssYEG.asZGu603yvkl7Sy6XHze5.WPs/lH6yq', 'WAREHOUSE', true),
  ('Accounts User', 'accounts@smartstock.local', '$2b$10$dJjMFYZr2ez0LSoLssYEG.asZGu603yvkl7Sy6XHze5.WPs/lH6yq', 'ACCOUNTS', true)
ON CONFLICT (email) DO NOTHING;
