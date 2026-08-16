-- ============================================================
-- seed.sql — Dummy data for agent 58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e
-- Run after all migrations have been applied.
-- ============================================================

-- Demo auth user so the seed's agent_id FK is satisfied.
-- Login for the app: jordan.rivera@realty.com / DemoPassword123!
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e',
  'authenticated', 'authenticated',
  'jordan.rivera@realty.com',
  crypt('DemoPassword123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', 'Jordan Rivera'),
  NOW(), NOW(),
  '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e',
  '58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e',
  'email',
  jsonb_build_object(
    'sub', '58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e',
    'email', 'jordan.rivera@realty.com',
    'email_verified', true,
    'phone_verified', false
  ),
  NOW(), NOW(), NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;


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
  qualified_date, drivers_license_human_verified_date
) VALUES
  -- inquired only
  (p1, agent, 'Marcus',   'Webb',    'prospect', 3055551201, 'marcus.webb@gmail.com',
   4800, FALSE, '2026-05-01', NULL, NULL),

  -- qualified
  (p2, agent, 'Priya',    'Sharma',  'prospect', 7185552309, 'priya.sharma@outlook.com',
   5500, FALSE, '2026-05-15',
   '2026-04-03 10:00:00+00', '2026-04-04 14:30:00+00'),

  -- toured
  (p3, agent, 'Derek',    'Nguyen',  'prospect', 6465553417, 'derek.nguyen@yahoo.com',
   6200, FALSE, '2026-05-01',
   '2026-03-28 09:00:00+00', '2026-03-29 11:00:00+00'),

  -- applied
  (p4, agent, 'Sofia',    'Okafor',  'prospect', 9295554522, 'sofia.okafor@gmail.com',
   7000, FALSE, '2026-04-15',
   '2026-03-20 10:00:00+00', '2026-03-21 15:00:00+00'),

  -- applied (with prior eviction, still in review)
  (p5, agent, 'Tyler',    'Brooks',  'prospect', 7185555630, 'tyler.brooks@hotmail.com',
   4200, TRUE,  '2026-06-01',
   '2026-04-01 08:00:00+00', '2026-04-02 09:00:00+00')
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
      drivers_license_human_verified_date = EXCLUDED.drivers_license_human_verified_date;


-- ============================================================
-- CONTACTS — Tenants (currently occupying or in notice)
-- ============================================================
INSERT INTO contacts (
  id, agent_id, first_name, last_name, type, phone, email,
  monthly_income, has_evictions, qualified_date,
  drivers_license_human_verified_date
) VALUES
  (t1, agent, 'Linda',    'Castillo', 'tenant', 9175556701, 'linda.castillo@gmail.com',
   5200, FALSE, '2025-06-10 10:00:00+00',
   '2025-06-11 14:00:00+00'),

  (t2, agent, 'James',    'Osei',     'tenant', 3475557812, 'james.osei@icloud.com',
   6800, FALSE, '2025-03-05 09:00:00+00',
   '2025-03-06 11:00:00+00'),

  (t3, agent, 'Aisha',    'Fernandez','tenant', 6465558923, 'aisha.fernandez@gmail.com',
   5900, FALSE, '2025-09-15 10:00:00+00',
   '2025-09-16 13:00:00+00')
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
      drivers_license_human_verified_date = EXCLUDED.drivers_license_human_verified_date;


-- ============================================================
-- LEASING OPPORTUNITIES
-- ============================================================
INSERT INTO leasing_opportunities (
  id, contact_id, unit_id,
  inquired_date, qualified_date, showing_date, toured_date, applied_date,
  feedback_date, feedback
) VALUES
  -- p1 → u2: just inquired
  (gen_random_uuid(), p1, u2,
   '2026-04-07 14:00:00+00', NULL, NULL, NULL, NULL,
   NULL, NULL),

  -- p2 → u3: qualified, showing scheduled
  (gen_random_uuid(), p2, u3,
   '2026-04-01 10:00:00+00', '2026-04-03 10:00:00+00',
   '2026-04-12 11:00:00+00',
   NULL, NULL,
   NULL, NULL),

  -- p3 → u2: toured, positive feedback
  (gen_random_uuid(), p3, u2,
   '2026-03-25 09:00:00+00', '2026-03-28 09:00:00+00',
   '2026-04-02 11:00:00+00',
   '2026-04-02 12:30:00+00', NULL,
   '2026-04-02 13:00:00+00', 'Loved the natural light and the closet space. Very interested.'),

  -- p3 → u5: also toured studio as backup option
  (gen_random_uuid(), p3, u5,
   '2026-03-25 09:00:00+00', '2026-03-28 09:00:00+00',
   '2026-04-02 10:00:00+00',
   '2026-04-02 10:45:00+00', NULL,
   '2026-04-02 11:00:00+00', 'Nice but too small for their needs.'),

  -- p4 → u3: applied
  (gen_random_uuid(), p4, u3,
   '2026-03-15 08:00:00+00', '2026-03-20 10:00:00+00',
   '2026-03-25 11:00:00+00',
   '2026-03-25 12:00:00+00', '2026-04-01 16:00:00+00',
   '2026-03-25 12:30:00+00', 'Great fit. Very clean. Submitted application same day.'),

  -- p5 → u5: applied (flagged for eviction review)
  (gen_random_uuid(), p5, u5,
   '2026-03-28 10:00:00+00', '2026-04-01 08:00:00+00',
   '2026-04-06 10:00:00+00',
   '2026-04-06 11:00:00+00', '2026-04-08 15:00:00+00',
   '2026-04-06 11:30:00+00', 'Expressed strong interest. Disclosed prior eviction upfront.');


-- ============================================================
-- TENANT ↔ UNIT (current leases — drives "Current tenants" in Units UI)
-- units.stage for u1/u4 is occupied/notice; these rows link tenant contacts to those units.
-- ============================================================
INSERT INTO leasing_opportunities (
  id, contact_id, unit_id,
  inquired_date, qualified_date, showing_date, toured_date, applied_date,
  feedback_date, feedback
) VALUES
  ('c1000000-0000-0000-0000-000000000001', t1, u1,
   '2025-05-01 10:00:00+00', '2025-06-10 10:00:00+00',
   '2025-06-14 11:00:00+00',
   '2025-06-14 12:00:00+00', '2025-06-15 14:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000002', t3, u1,
   '2025-08-01 09:00:00+00', '2025-09-15 10:00:00+00',
   '2025-09-20 11:00:00+00',
   '2025-09-20 12:00:00+00', '2025-09-21 10:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000003', t2, u4,
   '2024-11-01 10:00:00+00', '2025-03-05 09:00:00+00',
   '2025-03-10 11:00:00+00',
   '2025-03-10 12:00:00+00', '2025-03-11 16:00:00+00',
   NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  contact_id     = EXCLUDED.contact_id,
  unit_id        = EXCLUDED.unit_id,
  inquired_date  = EXCLUDED.inquired_date,
  qualified_date = EXCLUDED.qualified_date,
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

-- ============================================================
-- EXTRA SEED — richer demo dataset for Jordan Rivera
-- Idempotent: safe to re-run.
-- ============================================================
DO $$
DECLARE
  agent UUID := '58a98fcb-36e4-4de7-8b3f-cb2e102c0b2e';

  -- Existing anchors we reference
  u2 UUID := 'a1000000-0000-0000-0000-000000000002';
  u3 UUID := 'a1000000-0000-0000-0000-000000000003';
  u5 UUID := 'a1000000-0000-0000-0000-000000000005';
  u1 UUID := 'a1000000-0000-0000-0000-000000000001';
  p1 UUID := 'b1000000-0000-0000-0000-000000000001';

  -- New Units
  u7  UUID := 'a1000000-0000-0000-0000-000000000007';
  u8  UUID := 'a1000000-0000-0000-0000-000000000008';
  u9  UUID := 'a1000000-0000-0000-0000-000000000009';
  u10 UUID := 'a1000000-0000-0000-0000-00000000000a';
  u11 UUID := 'a1000000-0000-0000-0000-00000000000b';
  u12 UUID := 'a1000000-0000-0000-0000-00000000000c';
  u13 UUID := 'a1000000-0000-0000-0000-00000000000d';
  u14 UUID := 'a1000000-0000-0000-0000-00000000000e';
  u15 UUID := 'a1000000-0000-0000-0000-00000000000f';

  -- New Prospects
  p6  UUID := 'b1000000-0000-0000-0000-000000000006';
  p7  UUID := 'b1000000-0000-0000-0000-000000000007';
  p8  UUID := 'b1000000-0000-0000-0000-000000000008';
  p9  UUID := 'b1000000-0000-0000-0000-000000000009';
  p10 UUID := 'b1000000-0000-0000-0000-00000000000a';
  p11 UUID := 'b1000000-0000-0000-0000-00000000000b';
  p12 UUID := 'b1000000-0000-0000-0000-00000000000c';
  p13 UUID := 'b1000000-0000-0000-0000-00000000000d';
  p14 UUID := 'b1000000-0000-0000-0000-00000000000e';
  p15 UUID := 'b1000000-0000-0000-0000-00000000000f';
  p16 UUID := 'b1000000-0000-0000-0000-000000000020';
  p17 UUID := 'b1000000-0000-0000-0000-000000000021';

  -- New Tenants
  t4 UUID := 'b1000000-0000-0000-0000-000000000031';
  t5 UUID := 'b1000000-0000-0000-0000-000000000032';
  t6 UUID := 'b1000000-0000-0000-0000-000000000033';
  t7 UUID := 'b1000000-0000-0000-0000-000000000034';
  t8 UUID := 'b1000000-0000-0000-0000-000000000035';
BEGIN

-- ============================================================
-- UNITS
-- ============================================================
INSERT INTO units (id, agent_id, name, stage, rent, beds, baths, size, ttlock_id) VALUES
  (u7,  agent, '412 Maple Ave – Apt 3C',  'occupied', 1800.00, 1, 1.0, 700,  10007),
  (u8,  agent, '412 Maple Ave – Apt 4D',  'vacant',   2050.00, 3, 2.0, 1100, 10008),
  (u9,  agent, '78 Elm Street – Unit 1',  'occupied', 2150.00, 3, 2.0, 1080, 10009),
  (u10, agent, '78 Elm Street – Unit 2',  'notice',   2300.00, 3, 2.5, 1200, 10010),
  (u11, agent, '900 Oak Blvd – Studio C', 'vacant',   1400.00, 0, 1.0, 500,  NULL),
  (u12, agent, '900 Oak Blvd – Studio D', 'occupied', 1350.00, 0, 1.0, 480,  10012),
  (u13, agent, '15 Pine Ridge – Loft A',  'vacant',   2600.00, 2, 2.0, 1350, NULL),
  (u14, agent, '15 Pine Ridge – Loft B',  'occupied', 2550.00, 2, 2.0, 1300, 10014),
  (u15, agent, '33 Cedar Ct – Townhouse', 'vacant',   3200.00, 4, 3.0, 1900, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROSPECTS
-- ============================================================
INSERT INTO contacts (
  id, agent_id, first_name, last_name, type, phone, email,
  monthly_income, has_evictions, preferred_move_in_date,
  qualified_date, drivers_license_human_verified_date
) VALUES
  (p6,  agent, 'Rachel',    'Kim',        'prospect', 2125551601, 'rachel.kim@gmail.com',
   6100, FALSE, '2026-06-01', NULL, NULL),
  (p7,  agent, 'Devon',     'Wright',     'prospect', 3475552710, 'devon.wright@outlook.com',
   4500, FALSE, '2026-07-15', NULL, NULL),
  (p8,  agent, 'Ana',       'Reyes',      'prospect', 6465553811, 'ana.reyes@yahoo.com',
   5300, FALSE, '2026-06-15', NULL, NULL),
  (p9,  agent, 'Marcus',    'Chen',       'prospect', 9295554912, 'marcus.chen@gmail.com',
   7800, FALSE, '2026-05-20', '2026-04-08 10:00:00+00', NULL),
  (p10, agent, 'Ellie',     'Ward',       'prospect', 7185556013, 'ellie.ward@icloud.com',
   5900, FALSE, '2026-06-01', '2026-04-05 12:00:00+00', NULL),
  (p11, agent, 'Kaan',      'Yilmaz',     'prospect', 3055557114, 'kaan.yilmaz@gmail.com',
   9200, FALSE, '2026-05-15', '2026-04-07 09:30:00+00', '2026-04-09 15:00:00+00'),
  (p12, agent, 'Ines',      'Delacroix',  'prospect', 6465558215, 'ines.delacroix@outlook.com',
   6400, FALSE, '2026-05-10', '2026-04-01 10:00:00+00', '2026-04-02 14:00:00+00'),
  (p13, agent, 'Nate',      'Foreman',    'prospect', 7185559316, 'nate.foreman@yahoo.com',
   5100, FALSE, '2026-05-20', '2026-03-30 08:30:00+00', '2026-04-01 10:00:00+00'),
  (p14, agent, 'Cassandra', 'Bell',       'prospect', 3055550417, 'cassandra.bell@gmail.com',
   6900, FALSE, '2026-05-01', '2026-03-25 09:00:00+00', '2026-03-26 11:00:00+00'),
  (p15, agent, 'Wilder',    'Bishop',     'prospect', 9295551518, 'wilder.bishop@icloud.com',
   8100, FALSE, '2026-05-15', '2026-03-27 10:30:00+00', '2026-03-28 09:00:00+00'),
  (p16, agent, 'Skye',      'Morales',    'prospect', 3475552619, 'skye.morales@gmail.com',
   5400, FALSE, '2025-09-01', '2025-07-10 09:00:00+00', '2025-07-11 12:00:00+00'),
  (p17, agent, 'Fatima',    'Osman',      'prospect', 6465553720, 'fatima.osman@outlook.com',
   6700, FALSE, '2026-05-10', '2026-03-28 09:00:00+00', '2026-03-29 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TENANTS
-- ============================================================
INSERT INTO contacts (
  id, agent_id, first_name, last_name, type, phone, email,
  monthly_income, has_evictions, qualified_date,
  drivers_license_human_verified_date
) VALUES
  (t4, agent, 'Owen',     'Blackwell', 'tenant', 2125554821, 'owen.blackwell@gmail.com',
   6500, FALSE, '2024-08-10 10:00:00+00', '2024-08-11 14:00:00+00'),
  (t5, agent, 'Diana',    'Krohn',     'tenant', 3475555922, 'diana.krohn@outlook.com',
   7100, FALSE, '2025-01-15 09:00:00+00', '2025-01-16 11:00:00+00'),
  (t6, agent, 'Rafael',   'Moreno',    'tenant', 7185557023, 'rafael.moreno@gmail.com',
   4800, FALSE, '2024-11-01 10:00:00+00', '2024-11-02 15:00:00+00'),
  (t7, agent, 'Yuki',     'Tanaka',    'tenant', 6465558124, 'yuki.tanaka@yahoo.com',
   8300, FALSE, '2025-02-20 09:00:00+00', '2025-02-21 13:00:00+00'),
  (t8, agent, 'Priyanka', 'Iyer',      'tenant', 9295559225, 'priyanka.iyer@gmail.com',
   7500, FALSE, '2024-06-05 10:00:00+00', '2024-06-06 12:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LEASING OPPORTUNITIES (prospects)
-- ============================================================
INSERT INTO leasing_opportunities (
  id, contact_id, unit_id,
  inquired_date, qualified_date, showing_date, toured_date, applied_date,
  feedback_date, feedback
) VALUES
  -- Inquired
  ('d1000000-0000-0000-0000-000000000001', p6,  u8,
   '2026-04-09 10:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL),
  ('d1000000-0000-0000-0000-000000000002', p6,  u13,
   '2026-04-10 11:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL),
  ('d1000000-0000-0000-0000-000000000003', p7,  u5,
   '2026-04-08 09:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL),
  ('d1000000-0000-0000-0000-000000000004', p8,  u11,
   '2026-04-09 14:00:00+00', NULL, NULL, NULL, NULL, NULL, NULL),

  -- Qualified
  ('d1000000-0000-0000-0000-000000000005', p9,  u15,
   '2026-04-05 10:00:00+00', '2026-04-08 10:00:00+00', NULL, NULL, NULL, NULL, NULL),
  ('d1000000-0000-0000-0000-000000000006', p10, u2,
   '2026-04-02 10:00:00+00', '2026-04-05 12:00:00+00', NULL, NULL, NULL, NULL, NULL),

  -- Showing scheduled
  ('d1000000-0000-0000-0000-000000000007', p11, u13,
   '2026-04-04 11:00:00+00', '2026-04-07 09:30:00+00', '2026-04-14 11:00:00+00', NULL, NULL, NULL, NULL),

  -- Toured
  ('d1000000-0000-0000-0000-000000000008', p12, u3,
   '2026-03-28 09:00:00+00', '2026-04-01 10:00:00+00', '2026-04-04 11:00:00+00', '2026-04-04 11:45:00+00', NULL, NULL, NULL),
  ('d1000000-0000-0000-0000-000000000009', p12, u8,
   '2026-03-28 09:00:00+00', '2026-04-01 10:00:00+00', '2026-04-04 12:00:00+00', '2026-04-04 12:40:00+00', NULL, NULL, NULL),
  ('d1000000-0000-0000-0000-00000000000a', p13, u5,
   '2026-03-27 08:00:00+00', '2026-03-30 08:30:00+00', '2026-04-03 10:00:00+00', '2026-04-03 10:30:00+00', NULL, NULL, NULL),

  -- Applied
  ('d1000000-0000-0000-0000-00000000000b', p14, u3,
   '2026-03-20 10:00:00+00', '2026-03-25 09:00:00+00', '2026-03-28 11:00:00+00', '2026-03-28 11:45:00+00', '2026-04-01 15:00:00+00', NULL, NULL),
  ('d1000000-0000-0000-0000-00000000000c', p15, u15,
   '2026-03-22 09:00:00+00', '2026-03-27 10:30:00+00', '2026-03-30 10:00:00+00', '2026-03-30 10:40:00+00', '2026-04-02 17:00:00+00', NULL, NULL),

  -- Historic (last year)
  ('d1000000-0000-0000-0000-00000000000d', p16, u3,
   '2025-06-10 10:00:00+00', '2025-07-10 09:00:00+00', '2025-07-14 11:00:00+00', '2025-07-14 11:30:00+00', '2025-07-18 15:00:00+00',
   '2025-07-20 10:00:00+00', 'Chose another property closer to work.'),

  -- Feedback stage (multi-unit tour, comparing)
  ('d1000000-0000-0000-0000-00000000000e', p17, u2,
   '2026-03-25 09:00:00+00', '2026-03-28 09:00:00+00', '2026-04-01 11:00:00+00', '2026-04-01 11:45:00+00', NULL,
   '2026-04-01 12:15:00+00', 'Really liked the kitchen. Wants to see one more before deciding.'),
  ('d1000000-0000-0000-0000-00000000000f', p17, u8,
   '2026-03-25 09:00:00+00', '2026-03-28 09:00:00+00', '2026-04-05 10:00:00+00', '2026-04-05 10:45:00+00', NULL,
   '2026-04-05 11:30:00+00', 'Prefers this one — better light. Preparing application.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TENANT LEASES (new occupied units)
-- ============================================================
INSERT INTO leasing_opportunities (
  id, contact_id, unit_id,
  inquired_date, qualified_date, showing_date, toured_date, applied_date,
  feedback_date, feedback
) VALUES
  ('c1000000-0000-0000-0000-000000000004', t4, u7,
   '2024-07-15 10:00:00+00', '2024-08-10 10:00:00+00',
   '2024-08-14 11:00:00+00', '2024-08-14 12:00:00+00', '2024-08-15 09:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000005', t5, u9,
   '2024-12-01 09:00:00+00', '2025-01-15 09:00:00+00',
   '2025-01-18 11:00:00+00', '2025-01-18 12:00:00+00', '2025-01-19 14:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000006', t6, u12,
   '2024-09-15 09:00:00+00', '2024-11-01 10:00:00+00',
   '2024-11-03 10:00:00+00', '2024-11-03 10:30:00+00', '2024-11-04 15:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000007', t7, u14,
   '2025-01-05 10:00:00+00', '2025-02-20 09:00:00+00',
   '2025-02-23 11:00:00+00', '2025-02-23 12:00:00+00', '2025-02-24 16:00:00+00',
   NULL, NULL),
  ('c1000000-0000-0000-0000-000000000008', t8, u1,
   '2024-05-01 09:00:00+00', '2024-06-05 10:00:00+00',
   '2024-06-08 11:00:00+00', '2024-06-08 12:00:00+00', '2024-06-09 14:00:00+00',
   NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
INSERT INTO communications (contact_id, agent_id, type, direction, subject, body) VALUES
  -- p6
  (p6, agent, 'email', 'inbound', 'Inquiry — 3BR on Maple',
   'Hi! I saw the listing for 412 Maple Ave – Apt 4D. Is it pet friendly? I have a small dog.'),
  (p6, agent, 'email', 'outbound', 'Re: Inquiry — 3BR on Maple',
   'Hi Rachel! Yes, Apt 4D allows dogs under 40 lb with a $300 pet deposit. Let me know if you''d like to see it.'),
  (p6, agent, 'sms', 'outbound', NULL,
   'Also, we just posted a loft at 15 Pine Ridge if you want more space — happy to send details.'),

  -- p7
  (p7, agent, 'email', 'inbound', 'Studio A availability',
   'Hi, still looking for a studio. Is 900 Oak Blvd – Studio A available? What''s the deposit?'),
  (p7, agent, 'email', 'outbound', 'Re: Studio A availability',
   'Hi Devon, yes Studio A is available. Deposit is 1 month''s rent ($1,350). Can send an application link when you''re ready.'),

  -- p8
  (p8, agent, 'sms', 'inbound', NULL,
   'Hey, is Studio C at Oak Blvd still available?'),
  (p8, agent, 'sms', 'outbound', NULL,
   'Hi Ana! Yes it is — $1,400/mo. Want me to send more info?'),

  -- p9
  (p9, agent, 'email', 'inbound', 'Townhouse tour',
   'I''d like to tour the townhouse at 33 Cedar Ct. My family of 4 is relocating from Chicago.'),
  (p9, agent, 'email', 'outbound', 'Re: Townhouse tour',
   'Hi Marcus, welcome to the area! Happy to arrange a tour. Are weekends better for you?'),
  (p9, agent, 'phone', 'outbound', NULL,
   'Called Marcus — confirmed income, will send qualification email today.'),

  -- p10
  (p10, agent, 'email', 'inbound', 'Interested in Apt 2B',
   'Hello, saw Apt 2B on Zillow. What''s the earliest move-in?'),
  (p10, agent, 'email', 'outbound', 'Re: Interested in Apt 2B',
   'Hi Ellie, we can move you in as early as May 15. Application takes about 3 business days to review.'),

  -- p11
  (p11, agent, 'email', 'inbound', 'Loft at Pine Ridge',
   'Interested in the Loft A at 15 Pine Ridge. My income is around $110k. Any pet fees?'),
  (p11, agent, 'email', 'outbound', 'Re: Loft at Pine Ridge',
   'Hi Kaan, you''re easily qualified — nice. Pet fee is $300 refundable + $50/mo pet rent. Available for showing this Sunday.'),
  (p11, agent, 'sms', 'outbound', NULL,
   'Sunday 11am confirmed for the Pine Ridge showing. Address is 15 Pine Ridge, park anywhere on the street.'),

  -- p12
  (p12, agent, 'email', 'inbound', 'Both units at Maple',
   'Hi, would love to see both Apt 4D and Unit 3 on Elm on the same day if possible.'),
  (p12, agent, 'email', 'outbound', 'Re: Both units at Maple',
   'Hi Ines, easy — I can do back-to-back showings on Saturday. 11am and 12pm work?'),
  (p12, agent, 'sms', 'inbound', NULL,
   'Just finished both tours. Really liked the Elm one but Maple felt cozier. Thinking overnight.'),
  (p12, agent, 'sms', 'outbound', NULL,
   'Totally understand — take your time. Both are still available as of this morning.'),

  -- p13
  (p13, agent, 'sms', 'inbound', NULL,
   'Toured Studio A this morning. Loved it but concerned about kitchen size. Any similar options?'),
  (p13, agent, 'sms', 'outbound', NULL,
   'Hi Nate — the studio at 900 Oak Studio D has a bigger kitchen but it''s currently occupied. Turning over in June.'),

  -- p14
  (p14, agent, 'email', 'outbound', 'Application received — Elm St Unit 3',
   'Hi Cassandra, we''ve received your application. Reviewing now — should have a decision by end of week.'),
  (p14, agent, 'phone', 'inbound', NULL,
   'Cassandra called to ask about background check status. Confirmed we''re still awaiting one employer verification.'),
  (p14, agent, 'email', 'outbound', 'Update — Elm St Unit 3',
   'Hi Cassandra, background and income all cleared. Waiting on landlord reference. Should have final decision by tomorrow.'),

  -- p15
  (p15, agent, 'email', 'outbound', 'Application received — 33 Cedar Ct',
   'Hi Wilder, application received. Given the townhouse size we have a slightly longer review — around 5-7 business days.'),
  (p15, agent, 'email', 'inbound', 'Re: Application received',
   'Thanks Jordan! Also — is it possible to add my brother as co-applicant? He''ll be splitting rent.'),
  (p15, agent, 'email', 'outbound', 'Re: Re: Application received',
   'Absolutely. I''ll send him the co-applicant link right now. He''ll need to complete the same forms.'),

  -- p16 (historic)
  (p16, agent, 'email', 'inbound', 'Elm Street 3BR',
   'Hi, interested in the 3BR on Elm Street. Available for a Saturday tour?'),
  (p16, agent, 'email', 'outbound', 'Re: Elm Street 3BR',
   'Hi Skye, Saturday 10am works. I''ll send the address once you confirm.'),
  (p16, agent, 'email', 'inbound', 'Withdrawing application',
   'Hi Jordan, I found something closer to work. Withdrawing my application — thanks for the time.'),

  -- p17
  (p17, agent, 'email', 'inbound', 'Interested in 2BR options',
   'Hi Jordan, I''m looking at 2BR options — anything on Maple or nearby available in May?'),
  (p17, agent, 'email', 'outbound', 'Re: Interested in 2BR options',
   'Hi Fatima, I have Apt 2B on Maple ready, and Apt 4D coming available in early May. Want to see both?'),
  (p17, agent, 'sms', 'inbound', NULL,
   'Really liked Apt 4D. Kitchen was better than 2B. Can I look at floor plans again before applying?'),
  (p17, agent, 'sms', 'outbound', NULL,
   'Just sent them to your email. Take a look — happy to hold Apt 4D for 48 hours if you''re serious.'),

  -- t4
  (t4, agent, 'email', 'inbound', 'Lease renewal',
   'Hi, my lease is up in August. Renewal option?'),
  (t4, agent, 'email', 'outbound', 'Re: Lease renewal',
   'Hi Owen, we''d love to renew. Sending a 12-month renewal at a 3% increase this week.'),

  -- t5
  (t5, agent, 'sms', 'inbound', NULL,
   'Faucet in the kitchen is leaking. Can someone come look?'),
  (t5, agent, 'sms', 'outbound', NULL,
   'Sorry to hear Diana — sending our maintenance tech tomorrow between 9-11am. OK?'),

  -- t6
  (t6, agent, 'phone', 'inbound', NULL,
   'Rafael called about the noise complaint from the unit above. Following up with them today.'),

  -- t7
  (t7, agent, 'email', 'inbound', 'Parking spot swap',
   'Hi, is it possible to swap my parking spot with the vacant one closer to the entrance?'),
  (t7, agent, 'email', 'outbound', 'Re: Parking spot swap',
   'Hi Yuki, yes — I''ll update the assignment in the system today. Enjoy the shorter walk!'),

  -- t8
  (t8, agent, 'sms', 'inbound', NULL,
   'Rent payment went through — just wanted to double check on my end. All good?'),
  (t8, agent, 'sms', 'outbound', NULL,
   'Confirmed, Priyanka — payment received Sunday. Thanks for being on top of it as always!');

-- ============================================================
-- AI CONVERSATIONS
-- ============================================================
INSERT INTO ai_conversations (agent_id, contact_id, messages) VALUES
  (agent, p11,
   '[
     {"role":"user","content":"Draft a follow-up email to Kaan confirming Sunday''s Pine Ridge showing."},
     {"role":"assistant","content":"Subject: Sunday Showing Confirmation — 15 Pine Ridge, Loft A\n\nHi Kaan,\n\nJust confirming our showing this Sunday at 11am. The address is 15 Pine Ridge — feel free to park on the street.\n\nBring any questions and I''ll have both floor plans and the lease sample ready.\n\nSee you then,\nJordan"}
   ]'::jsonb),

  (agent, NULL,
   '[
     {"role":"user","content":"Which of my contacts have been in the pipeline the longest without moving stage?"},
     {"role":"assistant","content":"Looking at your leasing opportunities, three contacts have been stalled 30+ days:\n\n1. Marcus Webb — inquired only, no follow-through since April 7\n2. Rachel Kim — inquired on two units but hasn''t responded to your loft offer\n3. Devon Wright — inquired on Studio A but hasn''t started the qualification form\n\nAll three could use a nudge — want me to draft a check-in message?"}
   ]'::jsonb),

  (agent, p15,
   '[
     {"role":"user","content":"Send a message to Wilder Bishop confirming his co-applicant link was sent."},
     {"role":"assistant","content":"Subject: Co-applicant link sent — 33 Cedar Ct\n\nHi Wilder,\n\nI just sent the co-applicant application link to your brother. Once he completes his portion, we''ll process both together. This shouldn''t add much time to the overall review.\n\nLet me know if he runs into any issues.\n\nBest,\nJordan Rivera"}
   ]'::jsonb);

END $$;
