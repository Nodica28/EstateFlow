-- ============================================================
-- seed.sql — Dummy data for agent 58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e
-- Run after all migrations have been applied.
-- ============================================================

DO $$
DECLARE
  agent UUID := '58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e';

  -- Units
  u1 UUID := 'a1000000-0000-0000-0000-000000000001';
  u2 UUID := 'a1000000-0000-0000-0000-000000000002';
  u3 UUID := 'a1000000-0000-0000-0000-000000000003';
  u4 UUID := 'a1000000-0000-0000-0000-000000000004';
  u5 UUID := 'a1000000-0000-0000-0000-000000000005';
  u6 UUID := 'a1000000-0000-0000-0000-000000000006';

  -- Contacts (prospects)
  p1 UUID := 'b1000000-0000-0000-0000-000000000001';
  p2 UUID := 'b1000000-0000-0000-0000-000000000002';
  p3 UUID := 'b1000000-0000-0000-0000-000000000003';
  p4 UUID := 'b1000000-0000-0000-0000-000000000004';
  p5 UUID := 'b1000000-0000-0000-0000-000000000005';

  -- Contacts (tenants)
  t1 UUID := 'b1000000-0000-0000-0000-000000000011';
  t2 UUID := 'b1000000-0000-0000-0000-000000000012';
  t3 UUID := 'b1000000-0000-0000-0000-000000000013';

BEGIN

-- ============================================================
-- PROFILE (upsert in case the trigger already created it)
-- ============================================================
INSERT INTO profiles (id, full_name, email)
VALUES (agent, 'Jordan Rivera', 'jordan.rivera@realty.com')
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email     = EXCLUDED.email;


-- ============================================================
-- UNITS
-- ============================================================
INSERT INTO units (id, agent_id, name, stage, rent, beds, baths, size, ttlock_id) VALUES
  (u1, agent, '412 Maple Ave – Apt 1A', 'occupied',   1850.00, 2, 1.0, 850,  10001),
  (u2, agent, '412 Maple Ave – Apt 2B', 'vacant',     1950.00, 2, 2.0, 920,  10002),
  (u3, agent, '78 Elm Street – Unit 3', 'vacant',     2200.00, 3, 2.0, 1100, 10003),
  (u4, agent, '78 Elm Street – Unit 4', 'notice',     2100.00, 3, 1.5, 1050, 10004),
  (u5, agent, '900 Oak Blvd – Studio A','vacant',     1350.00, 0, 1.0, 480,  NULL),
  (u6, agent, '900 Oak Blvd – Studio B','terminated', 1400.00, 0, 1.0, 500,  NULL)
ON CONFLICT (id) DO UPDATE
  SET agent_id = EXCLUDED.agent_id,
      name     = EXCLUDED.name,
      stage    = EXCLUDED.stage,
      rent     = EXCLUDED.rent,
      beds     = EXCLUDED.beds,
      baths    = EXCLUDED.baths,
      size     = EXCLUDED.size,
      ttlock_id = EXCLUDED.ttlock_id;


-- ============================================================
-- CONTACTS — Prospects (various pipeline stages)
-- ============================================================
INSERT INTO contacts (
  id, agent_id, first_name, last_name, type, phone, email,
  monthly_income, has_evictions, preferred_move_in_date,
  qualified_date, drivers_license, drivers_license_human_verified_date
) VALUES
  -- inquired only
  (p1, agent, 'Marcus',   'Webb',    'prospect', 3055551201, 'marcus.webb@gmail.com',
   4800, FALSE, '2026-05-01', NULL, NULL, NULL),

  -- qualified
  (p2, agent, 'Priya',    'Sharma',  'prospect', 7185552309, 'priya.sharma@outlook.com',
   5500, FALSE, '2026-05-15',
   '2026-04-03 10:00:00+00', 'storage/drivers-licenses/p2.jpg', '2026-04-04 14:30:00+00'),

  -- toured
  (p3, agent, 'Derek',    'Nguyen',  'prospect', 6465553417, 'derek.nguyen@yahoo.com',
   6200, FALSE, '2026-05-01',
   '2026-03-28 09:00:00+00', 'storage/drivers-licenses/p3.jpg', '2026-03-29 11:00:00+00'),

  -- applied
  (p4, agent, 'Sofia',    'Okafor',  'prospect', 9295554522, 'sofia.okafor@gmail.com',
   7000, FALSE, '2026-04-15',
   '2026-03-20 10:00:00+00', 'storage/drivers-licenses/p4.jpg', '2026-03-21 15:00:00+00'),

  -- applied (with prior eviction, still in review)
  (p5, agent, 'Tyler',    'Brooks',  'prospect', 7185555630, 'tyler.brooks@hotmail.com',
   4200, TRUE,  '2026-06-01',
   '2026-04-01 08:00:00+00', 'storage/drivers-licenses/p5.jpg', '2026-04-02 09:00:00+00')
ON CONFLICT (id) DO UPDATE
  SET agent_id                            = EXCLUDED.agent_id,
      first_name                          = EXCLUDED.first_name,
      last_name                           = EXCLUDED.last_name,
      type                                = EXCLUDED.type,
      phone                               = EXCLUDED.phone,
      email                               = EXCLUDED.email,
      monthly_income                      = EXCLUDED.monthly_income,
      has_evictions                       = EXCLUDED.has_evictions,
      preferred_move_in_date              = EXCLUDED.preferred_move_in_date,
      qualified_date                      = EXCLUDED.qualified_date,
      drivers_license                     = EXCLUDED.drivers_license,
      drivers_license_human_verified_date = EXCLUDED.drivers_license_human_verified_date;


-- ============================================================
-- CONTACTS — Tenants (currently occupying or in notice)
-- ============================================================
INSERT INTO contacts (
  id, agent_id, first_name, last_name, type, phone, email,
  monthly_income, has_evictions, qualified_date,
  drivers_license, drivers_license_human_verified_date
) VALUES
  (t1, agent, 'Linda',    'Castillo', 'tenant', 9175556701, 'linda.castillo@gmail.com',
   5200, FALSE, '2025-06-10 10:00:00+00',
   'storage/drivers-licenses/t1.jpg', '2025-06-11 14:00:00+00'),

  (t2, agent, 'James',    'Osei',     'tenant', 3475557812, 'james.osei@icloud.com',
   6800, FALSE, '2025-03-05 09:00:00+00',
   'storage/drivers-licenses/t2.jpg', '2025-03-06 11:00:00+00'),

  (t3, agent, 'Aisha',    'Fernandez','tenant', 6465558923, 'aisha.fernandez@gmail.com',
   5900, FALSE, '2025-09-15 10:00:00+00',
   'storage/drivers-licenses/t3.jpg', '2025-09-16 13:00:00+00')
ON CONFLICT (id) DO UPDATE
  SET agent_id                            = EXCLUDED.agent_id,
      first_name                          = EXCLUDED.first_name,
      last_name                           = EXCLUDED.last_name,
      type                                = EXCLUDED.type,
      phone                               = EXCLUDED.phone,
      email                               = EXCLUDED.email,
      monthly_income                      = EXCLUDED.monthly_income,
      has_evictions                       = EXCLUDED.has_evictions,
      qualified_date                      = EXCLUDED.qualified_date,
      drivers_license                     = EXCLUDED.drivers_license,
      drivers_license_human_verified_date = EXCLUDED.drivers_license_human_verified_date;


-- ============================================================
-- LEASING OPPORTUNITIES
-- ============================================================
INSERT INTO leasing_opportunities (
  id, contact_id, unit_id,
  inquired_date, qualified_date, scheduled_date, showing_date, toured_date, applied_date,
  feedback_date, feedback
) VALUES
  -- p1 → u2: just inquired
  (gen_random_uuid(), p1, u2,
   '2026-04-07 14:00:00+00', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL),

  -- p2 → u3: qualified, showing scheduled
  (gen_random_uuid(), p2, u3,
   '2026-04-01 10:00:00+00', '2026-04-03 10:00:00+00',
   '2026-04-05 09:00:00+00', '2026-04-12 11:00:00+00',
   NULL, NULL,
   NULL, NULL),

  -- p3 → u2: toured, positive feedback
  (gen_random_uuid(), p3, u2,
   '2026-03-25 09:00:00+00', '2026-03-28 09:00:00+00',
   '2026-03-30 10:00:00+00', '2026-04-02 11:00:00+00',
   '2026-04-02 12:30:00+00', NULL,
   '2026-04-02 13:00:00+00', 'Loved the natural light and the closet space. Very interested.'),

  -- p3 → u5: also toured studio as backup option
  (gen_random_uuid(), p3, u5,
   '2026-03-25 09:00:00+00', '2026-03-28 09:00:00+00',
   '2026-03-30 10:00:00+00', '2026-04-02 10:00:00+00',
   '2026-04-02 10:45:00+00', NULL,
   '2026-04-02 11:00:00+00', 'Nice but too small for their needs.'),

  -- p4 → u3: applied
  (gen_random_uuid(), p4, u3,
   '2026-03-15 08:00:00+00', '2026-03-20 10:00:00+00',
   '2026-03-22 09:00:00+00', '2026-03-25 11:00:00+00',
   '2026-03-25 12:00:00+00', '2026-04-01 16:00:00+00',
   '2026-03-25 12:30:00+00', 'Great fit. Very clean. Submitted application same day.'),

  -- p5 → u5: applied (flagged for eviction review)
  (gen_random_uuid(), p5, u5,
   '2026-03-28 10:00:00+00', '2026-04-01 08:00:00+00',
   '2026-04-03 09:00:00+00', '2026-04-06 10:00:00+00',
   '2026-04-06 11:00:00+00', '2026-04-08 15:00:00+00',
   '2026-04-06 11:30:00+00', 'Expressed strong interest. Disclosed prior eviction upfront.');


-- ============================================================
-- TENANT ↔ UNIT (current leases — drives "Current tenants" in Units UI)
-- units.stage for u1/u4 is occupied/notice; these rows link tenant contacts to those units.
-- ============================================================
INSERT INTO leasing_opportunities (
  id, contact_id, unit_id,
  inquired_date, qualified_date, scheduled_date, showing_date, toured_date, applied_date,
  feedback_date, feedback
) VALUES
  ('c1000000-0000-0000-0000-000000000001', t1, u1,
   '2025-05-01 10:00:00+00', '2025-06-10 10:00:00+00',
   '2025-06-12 15:00:00+00', '2025-06-14 11:00:00+00',
   '2025-06-14 12:00:00+00', '2025-06-15 14:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000002', t3, u1,
   '2025-08-01 09:00:00+00', '2025-09-15 10:00:00+00',
   '2025-09-18 10:00:00+00', '2025-09-20 11:00:00+00',
   '2025-09-20 12:00:00+00', '2025-09-21 10:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000003', t2, u4,
   '2024-11-01 10:00:00+00', '2025-03-05 09:00:00+00',
   '2025-03-08 10:00:00+00', '2025-03-10 11:00:00+00',
   '2025-03-10 12:00:00+00', '2025-03-11 16:00:00+00',
   NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  contact_id     = EXCLUDED.contact_id,
  unit_id        = EXCLUDED.unit_id,
  inquired_date  = EXCLUDED.inquired_date,
  qualified_date = EXCLUDED.qualified_date,
  scheduled_date = EXCLUDED.scheduled_date,
  showing_date   = EXCLUDED.showing_date,
  toured_date    = EXCLUDED.toured_date,
  applied_date   = EXCLUDED.applied_date,
  feedback_date  = EXCLUDED.feedback_date,
  feedback       = EXCLUDED.feedback;


-- ============================================================
-- COMMUNICATIONS
-- ============================================================
INSERT INTO communications (contact_id, agent_id, type, direction, subject, body) VALUES
  -- p1
  (p1, agent, 'email', 'inbound',
   'Inquiry about 2BR unit',
   'Hi, I saw your listing on Zillow for the 2-bedroom on Maple Ave. Is it still available? My budget is around $1,900/mo.'),
  (p1, agent, 'sms', 'outbound',
   NULL,
   'Hi Marcus! Yes, the unit is still available. Happy to schedule a showing. What days work best for you?'),

  -- p2
  (p2, agent, 'email', 'inbound',
   'Interested in 3BR on Elm St',
   'Hello, I''m looking for a 3-bedroom starting mid-May. Could you send over the application requirements?'),
  (p2, agent, 'email', 'outbound',
   'Re: Interested in 3BR on Elm St',
   'Hi Priya, thanks for reaching out! I''ve attached our qualification checklist. Monthly income requirement is 3× rent. Let me know when you''re free for a showing.'),
  (p2, agent, 'phone', 'outbound',
   NULL,
   'Spoke with Priya. Confirmed she meets income threshold. Scheduled showing for April 12 at 11am.'),

  -- p3
  (p3, agent, 'sms', 'inbound',
   NULL,
   'Hey, just finished the tour of Apt 2B. Really liked it! How soon can I apply?'),
  (p3, agent, 'sms', 'outbound',
   NULL,
   'Great to hear, Derek! I''ll send you the online application link right now. Takes about 15 minutes.'),

  -- p4
  (p4, agent, 'email', 'outbound',
   'Application received – Unit 3 on Elm St',
   'Hi Sofia, we''ve received your completed application for the 3BR on Elm Street. We''ll be in touch within 3–5 business days.'),
  (p4, agent, 'phone', 'inbound',
   NULL,
   'Sofia called to confirm docs were received. Reassured her timeline. She sounded very motivated.'),

  -- p5
  (p5, agent, 'email', 'inbound',
   'Application – Studio A',
   'Hi, I submitted my application for the studio. I wanted to be upfront — I had an eviction 4 years ago but have had perfect rental history since. Happy to provide references.'),
  (p5, agent, 'email', 'outbound',
   'Re: Application – Studio A',
   'Thanks for the transparency, Tyler. We''ll review all submitted documents and references carefully. You''ll hear back by end of next week.'),

  -- t1 (existing tenant)
  (t1, agent, 'email', 'inbound',
   'Lease renewal question',
   'Hi Jordan, my lease is up in July. Is renewal an option? I''d love to stay if the rate is reasonable.'),
  (t1, agent, 'email', 'outbound',
   'Re: Lease renewal question',
   'Hi Linda! Absolutely, we''d love to have you stay. I''ll prepare a renewal offer at a 3% increase and send it over this week.'),

  -- t2 (notice tenant)
  (t2, agent, 'sms', 'inbound',
   NULL,
   'Hey, just wanted to confirm — I submitted my 60-day notice yesterday via the portal. Moving out June 1st.'),
  (t2, agent, 'sms', 'outbound',
   NULL,
   'Got it James, notice received. We''ll coordinate the move-out inspection about a week before. Thanks for the heads-up!');


-- ============================================================
-- AI_CONVERSATIONS
-- ============================================================
INSERT INTO ai_conversations (agent_id, contact_id, messages) VALUES
  (agent, p4,
   '[
     {"role":"user",    "content":"Can you draft a professional email telling Sofia Okafor her application is under review?"},
     {"role":"assistant","content":"Subject: Your Application is Under Review – 78 Elm Street, Unit 3\n\nHi Sofia,\n\nThank you for submitting your application for the 3-bedroom unit at 78 Elm Street. We''ve received all of your documents and our team has begun the review process.\n\nYou can expect to hear back from us within 3–5 business days. Please don''t hesitate to reach out if you have any questions in the meantime.\n\nBest regards,\nJordan Rivera"}
   ]'::jsonb),

  (agent, NULL,
   '[
     {"role":"user",    "content":"Which of my vacant units have the highest rent?"},
     {"role":"assistant","content":"Based on your current listings, here are your vacant units ranked by rent:\n\n1. 78 Elm Street – Unit 3: $2,200/mo (3 bed / 2 bath)\n2. 412 Maple Ave – Apt 2B: $1,950/mo (2 bed / 2 bath)\n3. 900 Oak Blvd – Studio A: $1,350/mo (Studio / 1 bath)\n\nUnit 3 on Elm Street has the most active interest — Sofia Okafor has already applied."}
   ]'::jsonb);

END $$;
