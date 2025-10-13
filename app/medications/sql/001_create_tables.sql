-- Medications Service Database Schema
--
-- This demonstrates building a database schema from scratch
-- for use with a custom Spring Boot GraphQL API.

-- Create medications schema for service isolation
CREATE SCHEMA IF NOT EXISTS medications;

-- Enable UUID extension (shared across database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prescriptions table (in medications schema)
CREATE TABLE IF NOT EXISTS medications.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  refills_remaining INTEGER NOT NULL DEFAULT 0,
  pharmacy VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_member_id ON medications.prescriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_id ON medications.prescriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON medications.prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_start_date ON medications.prescriptions(start_date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to prescriptions
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON medications.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
