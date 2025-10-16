-- ClaimSight Database Setup for Neon
-- Run this script in your Neon SQL Editor to set up the database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dob date NOT NULL,
    plan text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT members_plan_check CHECK ((plan = ANY (ARRAY['PPO'::text, 'HMO'::text, 'EPO'::text, 'POS'::text, 'HDHP'::text])))
);

COMMENT ON TABLE members IS 'Health plan members/patients';

-- Create provider_records table
CREATE TABLE IF NOT EXISTS provider_records (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    npi text NOT NULL UNIQUE,
    name text NOT NULL,
    specialty text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE provider_records IS 'Healthcare providers who submit claims';

-- Create claims table
CREATE TABLE IF NOT EXISTS claims (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES members(id),
    provider_id uuid NOT NULL REFERENCES provider_records(id),
    dos date NOT NULL,
    cpt text NOT NULL,
    charge_cents integer NOT NULL,
    allowed_cents integer NOT NULL,
    status text NOT NULL,
    denial_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT claims_allowed_cents_check CHECK ((allowed_cents >= 0)),
    CONSTRAINT claims_charge_cents_check CHECK ((charge_cents >= 0)),
    CONSTRAINT claims_status_check CHECK ((status = ANY (ARRAY['PAID'::text, 'DENIED'::text, 'PENDING'::text]))),
    CONSTRAINT denial_reason_required CHECK ((((status = 'DENIED'::text) AND (denial_reason IS NOT NULL)) OR (status <> 'DENIED'::text)))
);

COMMENT ON TABLE claims IS 'Medical claims submitted for services';
COMMENT ON COLUMN claims.dos IS 'Date of Service';
COMMENT ON COLUMN claims.cpt IS 'Current Procedural Terminology code';
COMMENT ON COLUMN claims.charge_cents IS 'Amount charged by provider in cents';
COMMENT ON COLUMN claims.allowed_cents IS 'Amount approved by insurance in cents';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claims_member_id ON claims(member_id);
CREATE INDEX IF NOT EXISTS idx_claims_provider_id ON claims(provider_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_provider_records_npi ON provider_records(npi);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_provider_records_updated_at ON provider_records;
CREATE TRIGGER update_provider_records_updated_at
    BEFORE UPDATE ON provider_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_claims_updated_at ON claims;
CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
