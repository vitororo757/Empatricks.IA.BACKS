import { PGlite } from '../node_modules/.pnpm/@electric-sql+pglite@0.4.3/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
const q = sql => db.exec(sql);
try {
 await q(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY, email text);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT COALESCE(nullif(current_setting('request.jwt.claims', true),''), '{}')::jsonb $$;`);
 for (const f of ['supabase/migrations/20261019120742_initial_equipment_loans.sql','supabase/migrations/20261111000000_practice_loans.sql']) await q(await readFile(f,'utf8'));
 const sql = await readFile('supabase/carga-inicial-sem-fotos.sql','utf8');
 await q(sql); await q(sql);
 let r = await q(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status='maintenance')::int AS maintenance, count(image_url)::int AS images FROM public.equipment`);
 assert.deepEqual(r[0].rows[0],{total:12,maintenance:3,images:0}); console.log('PASS: 12 equipment, three maintenance, no photos; repeat is idempotent');
 await q(`UPDATE public.equipment SET image_url='https://example.test/preserved.jpg' WHERE asset_tag='TI-0001'`); await q(sql);
 r=await q(`SELECT image_url FROM equipment WHERE asset_tag='TI-0001'`); assert.equal(r[0].rows[0].image_url,'https://example.test/preserved.jpg'); console.log('PASS: existing image preserved');
 await q(`UPDATE public.equipment SET status='maintenance', name='do not alter' WHERE asset_tag='TI-0002'`);
 try {await q(sql); assert.fail('unexpected acceptance');} catch(e) {if(!String(e).includes('Estado existente difere')) throw e; await q('ROLLBACK');}
 r=await q(`SELECT status,name FROM equipment WHERE asset_tag='TI-0002'`); assert.deepEqual(r[0].rows[0],{status:'maintenance',name:'do not alter'}); console.log('PASS: conflicting status aborts and preserves data');
 await q(`UPDATE public.equipment SET status='available' WHERE asset_tag='TI-0002'; INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111','test@example.test'); SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false); INSERT INTO public.loans (equipment_id) SELECT id FROM equipment WHERE asset_tag='TI-0001';`);
 try {await q(sql); assert.fail('unexpected acceptance');} catch(e) {if(!String(e).includes('Estado existente difere') && !String(e).includes('empréstimo ativo')) throw e; await q('ROLLBACK');}
 r=await q(`SELECT status,(SELECT count(*)::int FROM loans WHERE returned_at IS NULL) AS active FROM equipment WHERE asset_tag='TI-0001'`); assert.deepEqual(r[0].rows[0],{status:'on_loan',active:1}); console.log('PASS: active loan aborts and loan/status preserved');
} finally { await db.close(); }
