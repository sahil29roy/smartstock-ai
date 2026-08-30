-- Migration: 014_create_ai_logs
-- Created: 2026-08-29
-- Description: Add MANAGER and USER to user_role enum and create ai_logs table

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'USER';

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role VARCHAR(50) NOT NULL,
  feature VARCHAR(100) NOT NULL,
  success BOOLEAN NOT NULL,
  latency_ms INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
