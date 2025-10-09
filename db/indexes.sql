-- ClaimSight Database Indexes
-- Performance optimization for common query patterns

-- Members indexes
CREATE INDEX idx_members_dob ON members(dob);
CREATE INDEX idx_members_plan ON members(plan);
CREATE INDEX idx_members_last_name ON members(last_name);

-- Provider Records indexes
CREATE INDEX idx_provider_records_npi ON provider_records(npi);
CREATE INDEX idx_provider_records_specialty ON provider_records(specialty);

-- Claims indexes (most frequently queried table)
CREATE INDEX idx_claims_member_id ON claims(member_id);
CREATE INDEX idx_claims_provider_id ON claims(provider_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_dos ON claims(dos DESC);
CREATE INDEX idx_claims_member_status ON claims(member_id, status);
CREATE INDEX idx_claims_member_dos ON claims(member_id, dos DESC);
CREATE INDEX idx_claims_denial_reason ON claims(denial_reason) WHERE status = 'DENIED';

-- Composite index for common filtering
CREATE INDEX idx_claims_member_status_dos ON claims(member_id, status, dos DESC);

-- Eligibility checks indexes
CREATE INDEX idx_eligibility_checks_member_id ON eligibility_checks(member_id);
CREATE INDEX idx_eligibility_checks_checked_at ON eligibility_checks(checked_at DESC);
CREATE INDEX idx_eligibility_checks_member_checked ON eligibility_checks(member_id, checked_at DESC);

-- Notes indexes
CREATE INDEX idx_notes_member_id ON notes(member_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_member_created ON notes(member_id, created_at DESC);

-- Full-text search index for notes body
CREATE INDEX idx_notes_body_fts ON notes USING gin(to_tsvector('english', body));

-- JSONB index for eligibility check results
CREATE INDEX idx_eligibility_checks_result ON eligibility_checks USING gin(result);

-- Comments
COMMENT ON INDEX idx_claims_member_status_dos IS 'Composite index for member claims list with status filter';
COMMENT ON INDEX idx_notes_body_fts IS 'Full-text search index for case management notes';
COMMENT ON INDEX idx_eligibility_checks_result IS 'GIN index for JSONB eligibility results queries';
