-- Migration: 002_create_customers
-- Created: 2026-08-23
-- Description: Create customers table, constraints, and indexes

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  gst_number VARCHAR(15),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for searching and sorting
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Partial unique indexes to support soft deletion and prevent duplicates among active records

CREATE UNIQUE INDEX idx_customers_email_active ON customers(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_customers_phone_active ON customers(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE UNIQUE INDEX idx_customers_gst_active ON customers(gst_number) WHERE deleted_at IS NULL AND gst_number IS NOT NULL;
