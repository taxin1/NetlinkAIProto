-- ==============================================================================
-- 026_verify_rls_multiuser_proof.sql
-- Proof of Multi-User Row Level Security (RLS) Isolation
-- Simulates User A, User B, and Anonymous Caller in an isolated transaction.
-- ==============================================================================

BEGIN; -- Run in a transaction so all test seed data is rolled back automatically

-- ==============================================================================
-- STEP 1: SEED TEST IDENTITIES IN AUTH.USERS (AS ADMIN / POSTGRES ROLE)
-- ==============================================================================
-- User A: 11111111-1111-1111-1111-111111111111
-- User B: 22222222-2222-2222-2222-222222222222
-- We create mock entries in auth.users first so foreign key constraints on
-- public.contacts, public.emails, public.user_email_settings, etc. pass.

DELETE FROM auth.users 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid
) OR email IN (
  'proof_user_a@netlink-security.test',
  'proof_user_b@netlink-security.test'
);

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'proof_user_a@netlink-security.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'proof_user_b@netlink-security.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

-- ==============================================================================
-- STEP 2: SIMULATE USER A (ACTOR 1)
-- ==============================================================================
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
SET LOCAL "request.jwt.claim.role" = 'authenticated';

-- Verify current identity is User A
SELECT auth.uid() AS active_user_id, 'Should be 11111111-1111-1111-1111-111111111111' AS expected;

-- Insert private record for User A into contacts
INSERT INTO public.contacts (id, user_id, name, email, company, notes)
VALUES (
  'a1111111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'User A Secret Client',
  'secret-client@corp.internal',
  'Confidential Inc',
  'Highly private deal notes'
);

-- Insert private record for User A into emails (specifying valid contact_id)
INSERT INTO public.emails (id, user_id, contact_id, subject, body, status)
VALUES (
  'a1111111-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'a1111111-0000-0000-0000-000000000001',
  'Private Q3 Financials',
  'Confidential internal audit details.',
  'draft'
);

-- Insert private record for User A into user_email_settings
INSERT INTO public.user_email_settings (user_id, email_provider, email_address, email_password, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'smtp',
  'user_a@private.org',
  'SuperSecretPassword123',
  true
);

-- Ensure User A has a private network_profile
INSERT INTO public.network_profiles (user_id, email, is_public_profile)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'proof_user_a@netlink-security.test',
  false
)
ON CONFLICT (user_id) DO UPDATE SET is_public_profile = false;

-- PROOF 1: User A can see their own contacts
SELECT 'TEST 1: User A reads own contacts' AS test_name, count(*) AS visible_rows,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM public.contacts 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 2: User A can see their own emails
SELECT 'TEST 2: User A reads own emails' AS test_name, count(*) AS visible_rows,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM public.emails 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 3: User A can see their own SMTP credentials
SELECT 'TEST 3: User A reads own SMTP settings' AS test_name, count(*) AS visible_rows,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM public.user_email_settings 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 4: User A can see their own private network profile
SELECT 'TEST 4: User A reads own network profile' AS test_name, count(*) AS visible_rows,
       CASE WHEN count(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM public.network_profiles 
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- ==============================================================================
-- STEP 3: SWITCH CONTEXT TO USER B (ACTOR 2 / ADVERSARY)
-- ==============================================================================
SET LOCAL role = 'authenticated';
SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
SET LOCAL "request.jwt.claim.role" = 'authenticated';

-- Verify current identity switched to User B
SELECT auth.uid() AS active_user_id, 'Should be 22222222-2222-2222-2222-222222222222' AS expected;

-- PROOF 5: User B attempts to read User A contacts (RLS MUST BLOCK)
SELECT 'TEST 5: User B attempts to read User A contacts' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.contacts
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 6: User B attempts to read User A emails (RLS MUST BLOCK)
SELECT 'TEST 6: User B attempts to read User A emails' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.emails
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 7: User B attempts to read User A SMTP password (RLS MUST BLOCK)
SELECT 'TEST 7: User B attempts to read User A SMTP credentials' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.user_email_settings
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 8: User B attempts to read User A private network profile (RLS MUST BLOCK)
SELECT 'TEST 8: User B attempts to read User A private profile' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.network_profiles
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- PROOF 9: User B attempts to UPDATE User A contact (RLS MUST BLOCK)
UPDATE public.contacts
SET name = 'Compromised by User B'
WHERE id = 'a1111111-0000-0000-0000-000000000001';
-- Result: UPDATE 0 (User B cannot modify User A's row)

-- PROOF 10: User B attempts to DELETE User A email (RLS MUST BLOCK)
DELETE FROM public.emails
WHERE id = 'a1111111-0000-0000-0000-000000000002';
-- Result: DELETE 0 (User B cannot delete User A's row)

-- ==============================================================================
-- STEP 4: SWITCH CONTEXT TO ANONYMOUS CALLER (UNAUTHENTICATED GUEST)
-- ==============================================================================
SET LOCAL role = 'anon';
SET LOCAL "request.jwt.claims" = '{"role": "anon"}';
RESET "request.jwt.claim.sub";
SET LOCAL "request.jwt.claim.role" = 'anon';

-- Verify auth.uid() is NULL
SELECT auth.uid() AS active_user_id, 'Should be NULL' AS expected;

-- PROOF 11: Anonymous caller tries to read contacts (RLS MUST BLOCK)
SELECT 'TEST 11: Anonymous caller reads contacts' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.contacts;

-- PROOF 12: Anonymous caller tries to read waitlist (RLS MUST BLOCK)
SELECT 'TEST 12: Anonymous caller reads waitlist' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.waitlist;

-- PROOF 13: Anonymous caller tries to read User A private profile (RLS MUST BLOCK)
SELECT 'TEST 13: Anonymous caller reads private profile' AS test_name, count(*) AS leaked_rows,
       CASE WHEN count(*) = 0 THEN '✅ PASS (ZERO LEAKAGE)' ELSE '❌ FAIL (DATA LEAKED)' END AS status
FROM public.network_profiles
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- ==============================================================================
-- STEP 5: ROLLBACK TEST DATA
-- ==============================================================================
ROLLBACK; -- Leaves the database completely pristine (reverts seed users and records)
