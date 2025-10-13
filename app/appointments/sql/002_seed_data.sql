-- Appointments Service - Sample Data
--
-- This provides realistic test data for the appointments service.
-- Note: member_id and provider_id should match IDs from your Phase 1 Hasura database.

-- Sample Appointments
-- Using realistic UUIDs that might exist in your Phase 1 database
INSERT INTO appointments.appointments (id, member_id, provider_id, appointment_date, status, notes) VALUES
  -- Recent scheduled appointments
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   '550e8400-e29b-41d4-a716-446655440000',
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   '2025-10-15 10:00:00+00',
   'SCHEDULED',
   'Annual checkup - patient requested morning appointment'),

  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
   '550e8400-e29b-41d4-a716-446655440001',
   'ed70e072-cc35-4267-a667-860768d58510',
   '2025-10-16 14:30:00+00',
   'SCHEDULED',
   'Follow-up appointment for recent lab results'),

  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
   '550e8400-e29b-41d4-a716-446655440002',
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   '2025-10-17 09:00:00+00',
   'SCHEDULED',
   'New patient consultation'),

  -- Completed appointments
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
   '550e8400-e29b-41d4-a716-446655440000',
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   '2025-09-15 11:00:00+00',
   'COMPLETED',
   'Routine physical exam completed'),

  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
   '550e8400-e29b-41d4-a716-446655440001',
   'ed70e072-cc35-4267-a667-860768d58510',
   '2025-09-20 15:00:00+00',
   'COMPLETED',
   'Specialist consultation - referred by PCP'),

  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c',
   '550e8400-e29b-41d4-a716-446655440002',
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   '2025-08-10 10:30:00+00',
   'COMPLETED',
   'Blood work and lab tests'),

  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d',
   '550e8400-e29b-41d4-a716-446655440003',
   'ed70e072-cc35-4267-a667-860768d58510',
   '2025-08-25 13:00:00+00',
   'COMPLETED',
   'Vaccination appointment'),

  -- Cancelled appointments
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e',
   '550e8400-e29b-41d4-a716-446655440000',
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   '2025-09-05 09:30:00+00',
   'CANCELLED',
   'Patient called to reschedule - work conflict'),

  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
   '550e8400-e29b-41d4-a716-446655440001',
   'ed70e072-cc35-4267-a667-860768d58510',
   '2025-08-15 16:00:00+00',
   'CANCELLED',
   'Weather emergency - office closed'),

  -- No-show appointments
  ('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
   '550e8400-e29b-41d4-a716-446655440002',
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   '2025-07-20 14:00:00+00',
   'NO_SHOW',
   'Patient did not arrive for scheduled appointment');

-- Sample Billing Records
-- Linking to claim IDs (using realistic UUIDs)
INSERT INTO appointments.billing_records (id, claim_id, amount_billed, amount_paid, payment_date, payment_method) VALUES
  -- Fully paid insurance claims
  ('11111111-2222-4333-8444-555555555551',
   'c0a80121-7ac0-4d4e-8c5f-1234567890ab',
   25000,
   25000,
   '2025-09-20',
   'INSURANCE'),

  ('22222222-3333-4444-8555-666666666662',
   'c0a80121-7ac0-4d4e-8c5f-1234567890ac',
   15000,
   15000,
   '2025-09-25',
   'INSURANCE'),

  -- Partially paid claims with copay
  ('33333333-4444-4555-8666-777777777773',
   'c0a80121-7ac0-4d4e-8c5f-1234567890ad',
   20000,
   18000,
   '2025-08-15',
   'INSURANCE'),

  ('44444444-5555-4666-8777-888888888884',
   'c0a80121-7ac0-4d4e-8c5f-1234567890ad',
   2000,
   2000,
   '2025-08-15',
   'COPAY'),

  -- Deductible payments
  ('55555555-6666-4777-8888-999999999995',
   'c0a80121-7ac0-4d4e-8c5f-1234567890ae',
   30000,
   5000,
   '2025-08-20',
   'DEDUCTIBLE'),

  ('66666666-7777-4888-8999-aaaaaaaaaaaa',
   'c0a80121-7ac0-4d4e-8c5f-1234567890ae',
   25000,
   25000,
   '2025-08-22',
   'INSURANCE'),

  -- Out of pocket payments
  ('77777777-8888-4999-8aaa-bbbbbbbbbbbb',
   'c0a80121-7ac0-4d4e-8c5f-1234567890af',
   5000,
   5000,
   '2025-07-10',
   'OUT_OF_POCKET'),

  -- Pending insurance payment (paid amount = 0)
  ('88888888-9999-4aaa-8bbb-cccccccccccc',
   'c0a80121-7ac0-4d4e-8c5f-1234567890b0',
   35000,
   0,
   NULL,
   NULL);

-- Verify data insertion
SELECT
  'Appointments' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
  COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END) as no_show
FROM appointments.appointments

UNION ALL

SELECT
  'Billing Records' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN payment_method = 'INSURANCE' THEN 1 END) as insurance,
  COUNT(CASE WHEN payment_method = 'COPAY' THEN 1 END) as copay,
  COUNT(CASE WHEN payment_method = 'DEDUCTIBLE' THEN 1 END) as deductible,
  COUNT(CASE WHEN payment_method = 'OUT_OF_POCKET' THEN 1 END) as out_of_pocket
FROM appointments.billing_records;
