-- Medications Service - Sample Data
--
-- This provides realistic test data for the medications service.
-- Note: member_id and provider_id should match IDs from your Phase 1 Hasura database.

-- Sample Prescriptions
INSERT INTO medications.prescriptions (id, member_id, provider_id, medication_name, dosage, frequency, start_date, end_date, refills_remaining, pharmacy, status, notes) VALUES
  -- Active prescriptions
  ('11111111-1111-4111-8111-111111111111',
   'b240b73c-4903-48b2-a37d-ae1c1f0be0e5',  -- David Wilson
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   'Lisinopril',
   '10mg',
   'Once daily',
   '2025-09-01',
   '2026-09-01',
   3,
   'CVS Pharmacy',
   'ACTIVE',
   'Take in the morning with food'),

  ('22222222-2222-4222-8222-222222222222',
   'b240b73c-4903-48b2-a37d-ae1c1f0be0e5',  -- David Wilson
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   'Metformin',
   '500mg',
   'Twice daily',
   '2025-08-15',
   '2026-08-15',
   2,
   'Walgreens',
   'ACTIVE',
   'Take with meals to reduce stomach upset'),

  ('33333333-3333-4333-8333-333333333333',
   'e8282f10-7b67-41d2-9508-b88ac965abb4',  -- Robert Davis
   'ed70e072-cc35-4267-a667-860768d58510',
   'Atorvastatin',
   '20mg',
   'Once daily',
   '2025-10-01',
   '2026-10-01',
   3,
   'CVS Pharmacy',
   'ACTIVE',
   'Take in the evening'),

  ('44444444-4444-4444-8444-444444444444',
   'e8282f10-7b67-41d2-9508-b88ac965abb4',  -- Robert Davis
   'ed70e072-cc35-4267-a667-860768d58510',
   'Levothyroxine',
   '75mcg',
   'Once daily',
   '2025-07-01',
   '2026-07-01',
   5,
   'Walgreens',
   'ACTIVE',
   'Take on empty stomach, 30 minutes before breakfast'),

  ('55555555-5555-4555-8555-555555555555',
   '7c965372-bf2d-4199-adc4-2d5cb43e7751',  -- James Martin
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   'Albuterol Inhaler',
   '90mcg',
   'As needed',
   '2025-06-15',
   '2026-06-15',
   1,
   'Rite Aid',
   'ACTIVE',
   'Use as rescue inhaler for breathing difficulty'),

  -- Completed prescriptions
  ('66666666-6666-4666-8666-666666666666',
   '02c1b4fc-9607-458b-ac7d-acf15304d3c8',  -- William Rodriguez
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   'Amoxicillin',
   '500mg',
   'Three times daily',
   '2025-08-01',
   '2025-08-10',
   0,
   'CVS Pharmacy',
   'COMPLETED',
   'Completed 10-day course for infection'),

  ('77777777-7777-4777-8777-777777777777',
   '02c1b4fc-9607-458b-ac7d-acf15304d3c8',  -- William Rodriguez
   'ed70e072-cc35-4267-a667-860768d58510',
   'Prednisone',
   '20mg',
   'Once daily',
   '2025-07-15',
   '2025-07-20',
   0,
   'Walgreens',
   'COMPLETED',
   'Completed 5-day steroid taper'),

  -- Cancelled prescriptions
  ('88888888-8888-4888-8888-888888888888',
   'c15f4869-412b-4949-ae7f-fbff581a3af3',  -- Thomas Miller
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   'Simvastatin',
   '40mg',
   'Once daily',
   '2025-05-01',
   '2026-05-01',
   2,
   'Rite Aid',
   'CANCELLED',
   'Switched to different medication due to side effects'),

  -- Expired prescriptions
  ('99999999-9999-4999-8999-999999999999',
   'c15f4869-412b-4949-ae7f-fbff581a3af3',  -- Thomas Miller
   'bc6630ae-d320-4693-906a-9ab0c7f7eb51',
   'Hydrocodone',
   '5mg',
   'Every 4-6 hours as needed',
   '2024-12-01',
   '2025-01-01',
   0,
   'CVS Pharmacy',
   'EXPIRED',
   'Post-surgical pain management - expired'),

  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '7c965372-bf2d-4199-adc4-2d5cb43e7751',  -- James Martin
   'ed70e072-cc35-4267-a667-860768d58510',
   'Ibuprofen',
   '600mg',
   'Three times daily with food',
   '2024-11-15',
   '2025-02-15',
   0,
   'Walgreens',
   'EXPIRED',
   'Inflammation treatment - expired');

-- Verify data insertion
SELECT
  'Prescriptions' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
  COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired
FROM medications.prescriptions;
