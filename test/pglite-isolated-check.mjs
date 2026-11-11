import { PGlite } from '../node_modules/.pnpm/@electric-sql+pglite@0.4.3/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
const q = sql => db.exec(sql);
try {
 await q(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY, email text);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT COALESCE(nullif(current_setting('request.jwt.claims', true),''), '{}')::jsonb $$;
 GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticated;`);
 for (const f of ['supabase/migrations/20261019120742_initial_equipment_loans.sql','supabase/migrations/20261111000000_practice_loans.sql']) { await q(await readFile(f,'utf8')); console.log(`MIGRATION OK ${f}`); }
 let sql = await readFile('supabase/carga-manual.sql','utf8');
 const fixtures = Array.from({length:12},(_,i) => `('TI-${String(i+1).padStart(4,'0')}','https://example.test/${i+1}.jpg')`).join(',');
 sql = sql.replace(/^\\set .*$/gm,'').replace(/^\\copy .*$/m, `INSERT INTO imagens VALUES ${fixtures};`);
 await q(sql); await q(sql);
 let r = await q(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status='maintenance')::int AS maintenance, count(DISTINCT image_url)::int AS images FROM public.equipment`);
 assert.deepEqual(r[0].rows[0], {total:12,maintenance:3,images:12}); console.log('LOAD OK: 12 items, 3 maintenance, 12 unique fixture URLs, second run idempotent');
 r = await q(`SELECT public.loan_due_date(('2026-11-14 00:30:00+00'::timestamptz AT TIME ZONE 'America/Sao_Paulo')::date)::text AS due`);
 assert.equal(r[0].rows[0].due,'2026-12-03'); console.log('DATE OK: Sao Paulo midnight boundary and 14 weekdays');
 await q(`INSERT INTO auth.users(id,email) VALUES ('11111111-1111-4111-8111-111111111111','example@example.test'); SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
 for (let i=1;i<=5;i++) await q(`INSERT INTO public.loans(equipment_id) SELECT id FROM equipment WHERE asset_tag='TI-${String(i === 4 ? 5 : i > 4 ? 6 : i).padStart(4,'0')}';`);
 try { await q(`INSERT INTO public.loans(equipment_id) SELECT id FROM equipment WHERE asset_tag='TI-0008'`); assert.fail('sixth was accepted'); } catch (e) { if (!String(e).includes('five active loans')) throw e; console.log('LIMIT OK: sixth active loan rejected'); }
 try { await q(sql); assert.fail('repeated seed with active loans was accepted'); } catch(e) { if (!String(e).includes('Estado existente difere') && !String(e).includes('empréstimo ativo')) throw e; await q('ROLLBACK'); console.log('RELOAD OK: active loans prevent overwrite'); }
 await q(`INSERT INTO auth.users(id,email) VALUES ('22222222-2222-4222-8222-222222222222','other@example.test'); SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false); SELECT set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{}}',false);`);
 r = await q(`SELECT count(*)::int AS n FROM public.loans`); assert.equal(r[0].rows[0].n,0); console.log('RLS OK: another identity cannot read first user loans');
 try { await q(`INSERT INTO public.loans(equipment_id) SELECT id FROM public.equipment WHERE asset_tag='TI-0004'`); assert.fail('maintenance accepted'); } catch(e) { if (!String(e).includes('Equipment is not available')) throw e; console.log('MAINTENANCE OK: request rejected'); }
 await q('RESET ROLE');
 const incomplete = sql.replace("('TI-0012','https://example.test/12.jpg')", "('TI-9999','https://example.test/12.jpg')");
 try { await q(incomplete); assert.fail('incomplete list accepted'); } catch(e) { if (!String(e).includes('12 URLs HTTPS')) throw e; await q('ROLLBACK'); console.log('INPUT OK: missing exact asset rejected before changes'); }
 r = await q(`SELECT count(*)::int AS n FROM public.equipment`); assert.equal(r[0].rows[0].n,12); console.log('ROLLBACK OK: failed load left equipment unchanged');
} finally { await db.close(); }


