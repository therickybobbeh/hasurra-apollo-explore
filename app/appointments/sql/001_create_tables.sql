-- Appointments Service Schema
--
-- This demonstrates building a database schema using PostgreSQL schemas
-- for service isolation within a single database.

-- Create appointments schema for service isolation
CREATE SCHEMA IF NOT EXISTS appointments;

-- Enable UUID extension (shared across database)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Appointments table (in appointments schema)
CREATE TABLE IF NOT EXISTS appointments.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billing records table (in appointments schema)
CREATE TABLE IF NOT EXISTS appointments.billing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL,
  amount_billed INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('INSURANCE', 'COPAY', 'DEDUCTIBLE', 'OUT_OF_POCKET')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_member_id ON appointments.appointments(member_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments.appointments(status);
CREATE INDEX IF NOT EXISTS idx_billing_claim_id ON appointments.billing_records(claim_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to billing_records
CREATE TRIGGER update_billing_records_updated_at
  BEFORE UPDATE ON appointments.billing_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
