BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = extensions, public;

SELECT plan(15);

SELECT ok(to_regclass('public.equipment') IS NOT NULL, 'equipment table exists');
SELECT ok(to_regclass('public.loans') IS NOT NULL, 'loans table exists');
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.equipment'::regclass),
    'RLS is enabled on equipment'
);
SELECT ok(
    (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.loans'::regclass),
    'RLS is enabled on loans'
);
SELECT ok(
    (SELECT count(*) >= 2 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'equipment'),
    'equipment has explicit read and operations policies'
);
SELECT ok(
    (SELECT count(*) >= 3 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'loans'),
    'loans has explicit read, create, and return policies'
);
SELECT ok(
    EXISTS (SELECT 1 FROM pg_indexes
             WHERE schemaname = 'public'
               AND indexname = 'loans_one_active_per_equipment'),
    'only one active loan can exist per equipment'
);

INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-4111-8111-111111111111', 'employee-one@example.test'),
    ('22222222-2222-4222-8222-222222222222', 'employee-two@example.test'),
    ('33333333-3333-4333-8333-333333333333', 'operations@example.test');

INSERT INTO public.equipment (id, asset_tag, name, category, status) VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'TEST-001', 'Notebook 1', 'Notebook', 'available'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'TEST-002', 'Notebook 2', 'Notebook', 'available'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'TEST-003', 'Notebook 3', 'Notebook', 'available'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'TEST-004', 'Notebook 4', 'Notebook', 'available'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'TEST-005', 'Camera 1', 'Camera', 'maintenance'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'TEST-006', 'Monitor 1', 'Monitor', 'available');

SET LOCAL "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';
INSERT INTO public.loans (equipment_id, borrower_id, due_at) VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', current_date + 10),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '11111111-1111-4111-8111-111111111111', current_date + 10),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', '11111111-1111-4111-8111-111111111111', current_date + 10);

SET LOCAL "request.jwt.claim.sub" = '22222222-2222-4222-8222-222222222222';
INSERT INTO public.loans (equipment_id, borrower_id, due_at) VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', '22222222-2222-4222-8222-222222222222', current_date - 1);

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';
SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{}}';
SELECT is((SELECT count(*)::integer FROM public.loans), 3, 'a collaborator sees only their own loans');
SELECT is((SELECT count(*)::integer FROM public.equipment), 6, 'authenticated collaborators can read the catalog');
SELECT throws_ok(
    $$INSERT INTO public.loans (equipment_id) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6')$$,
    'P0001',
    'A borrower cannot have more than three active loans',
    'the fourth active loan is rejected'
);

SET LOCAL "request.jwt.claim.sub" = '22222222-2222-4222-8222-222222222222';
SET LOCAL "request.jwt.claims" = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{}}';
SELECT is((SELECT count(*)::integer FROM public.loans), 1, 'a second collaborator sees only their own loan');
SELECT throws_ok(
    $$INSERT INTO public.loans (equipment_id) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6')$$,
    'P0001',
    'A borrower with an overdue loan cannot borrow another item',
    'a borrower with an overdue loan is blocked'
);

SET LOCAL "request.jwt.claim.sub" = '33333333-3333-4333-8333-333333333333';
SET LOCAL "request.jwt.claims" = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","app_metadata":{"role":"operations"}}';
SELECT is((SELECT count(*)::integer FROM public.loans), 4, 'operations can see all loans');
SELECT throws_ok(
    $$INSERT INTO public.loans (equipment_id) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5')$$,
    'P0001',
    'Equipment is not available',
    'equipment in maintenance cannot be borrowed'
);

RESET ROLE;
SET LOCAL "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';
SET LOCAL "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{}}';
UPDATE public.loans
   SET returned_at = now()
 WHERE equipment_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
SELECT is(
    (SELECT status FROM public.equipment WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
    'available',
    'returning an item makes its equipment available again'
);

SELECT * FROM finish();
ROLLBACK;
