-- ClaimSight Database Schema
-- PostgreSQL 15+ with UUID extension

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('PPO', 'HMO', 'EPO', 'POS', 'HDHP')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Providers table
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npi TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claims table
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  dos DATE NOT NULL,
  cpt TEXT NOT NULL,
  charge_cents INTEGER NOT NULL CHECK (charge_cents >= 0),
  allowed_cents INTEGER NOT NULL CHECK (allowed_cents >= 0),
  status TEXT NOT NULL CHECK (status IN ('PAID', 'DENIED', 'PENDING')),
  denial_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT denial_reason_required CHECK (
    (status = 'DENIED' AND denial_reason IS NOT NULL) OR
    (status != 'DENIED')
  )
);

-- Eligibility checks table
CREATE TABLE eligibility_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  body TEXT NOT NULL
);

-- Triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE members IS 'Health plan members/patients';
COMMENT ON TABLE providers IS 'Healthcare providers (doctors, hospitals, etc.)';
COMMENT ON TABLE claims IS 'Medical claims submitted for services';
COMMENT ON TABLE eligibility_checks IS 'Member eligibility verification results';
COMMENT ON TABLE notes IS 'Case management notes for members';

COMMENT ON COLUMN claims.dos IS 'Date of Service';
COMMENT ON COLUMN claims.cpt IS 'Current Procedural Terminology code';
COMMENT ON COLUMN claims.charge_cents IS 'Amount charged by provider in cents';
COMMENT ON COLUMN claims.allowed_cents IS 'Amount allowed by plan in cents';
COMMENT ON COLUMN claims.denial_reason IS 'Reason for claim denial (required when status is DENIED)';
