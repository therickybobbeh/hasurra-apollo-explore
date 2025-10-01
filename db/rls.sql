-- ClaimSight Row-Level Security (RLS)
-- Hasura will use these policies with role-based headers

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS members_admin_all ON members;
DROP POLICY IF EXISTS members_member_own ON members;
DROP POLICY IF EXISTS members_provider_via_claims ON members;

DROP POLICY IF EXISTS providers_admin_all ON providers;
DROP POLICY IF EXISTS providers_member_via_claims ON providers;
DROP POLICY IF EXISTS providers_provider_own ON providers;

DROP POLICY IF EXISTS claims_admin_all ON claims;
DROP POLICY IF EXISTS claims_member_own ON claims;
DROP POLICY IF EXISTS claims_provider_own ON claims;

DROP POLICY IF EXISTS eligibility_checks_admin_all ON eligibility_checks;
DROP POLICY IF EXISTS eligibility_checks_member_own ON eligibility_checks;

DROP POLICY IF EXISTS notes_admin_all ON notes;
DROP POLICY IF EXISTS notes_member_own ON notes;

-- Members policies
CREATE POLICY members_admin_all ON members
  FOR ALL
  TO hasura_admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY members_member_own ON members
  FOR SELECT
  TO hasura_member
  USING (id = current_setting('hasura.user.x-hasura-user-id', true)::uuid);

CREATE POLICY members_provider_via_claims ON members
  FOR SELECT
  TO hasura_provider
  USING (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.member_id = members.id
      AND claims.provider_id = current_setting('hasura.user.x-hasura-provider-id', true)::uuid
    )
  );

-- Providers policies
CREATE POLICY providers_admin_all ON providers
  FOR ALL
  TO hasura_admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY providers_member_via_claims ON providers
  FOR SELECT
  TO hasura_member
  USING (
    EXISTS (
      SELECT 1 FROM claims
      WHERE claims.provider_id = providers.id
      AND claims.member_id = current_setting('hasura.user.x-hasura-user-id', true)::uuid
    )
  );

CREATE POLICY providers_provider_own ON providers
  FOR SELECT
  TO hasura_provider
  USING (id = current_setting('hasura.user.x-hasura-provider-id', true)::uuid);

-- Claims policies
CREATE POLICY claims_admin_all ON claims
  FOR ALL
  TO hasura_admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY claims_member_own ON claims
  FOR SELECT
  TO hasura_member
  USING (member_id = current_setting('hasura.user.x-hasura-user-id', true)::uuid);

CREATE POLICY claims_provider_own ON claims
  FOR SELECT
  TO hasura_provider
  USING (provider_id = current_setting('hasura.user.x-hasura-provider-id', true)::uuid);

-- Eligibility checks policies
CREATE POLICY eligibility_checks_admin_all ON eligibility_checks
  FOR ALL
  TO hasura_admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY eligibility_checks_member_own ON eligibility_checks
  FOR SELECT
  TO hasura_member
  USING (member_id = current_setting('hasura.user.x-hasura-user-id', true)::uuid);

-- Notes policies
CREATE POLICY notes_admin_all ON notes
  FOR ALL
  TO hasura_admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY notes_member_own ON notes
  FOR ALL
  TO hasura_member
  USING (member_id = current_setting('hasura.user.x-hasura-user-id', true)::uuid)
  WITH CHECK (member_id = current_setting('hasura.user.x-hasura-user-id', true)::uuid);

-- Create Hasura roles (users will be created by Hasura)
-- Note: These roles must also be configured in Hasura metadata

-- Comments
COMMENT ON POLICY members_member_own ON members IS 'Members can only see their own record';
COMMENT ON POLICY members_provider_via_claims ON members IS 'Providers can see members they have treated';
COMMENT ON POLICY claims_member_own ON claims IS 'Members can only see their own claims';
COMMENT ON POLICY claims_provider_own ON claims IS 'Providers can only see claims they submitted';
COMMENT ON POLICY notes_member_own ON notes IS 'Members can read and write their own notes';
