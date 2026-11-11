-- Decisões da prática: prazo em dias úteis (segunda a sexta, sem feriados)
-- e limite de cinco empréstimos. Aplicável a novos empréstimos, sem alterar históricos.
ALTER TABLE public.equipment ADD COLUMN image_url text;
CREATE FUNCTION public.loan_due_date(start_date date)
RETURNS date LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $fn$
DECLARE d date := start_date; weekdays integer := 0;
BEGIN
  WHILE weekdays < 14 LOOP
    d := d + 1;
    IF extract(isodow FROM d) < 6 THEN weekdays := weekdays + 1; END IF;
  END LOOP;
  RETURN d;
END;
$fn$;
ALTER TABLE public.loans ALTER COLUMN due_at SET DEFAULT public.loan_due_date((now() AT TIME ZONE 'America/Sao_Paulo')::date);
CREATE OR REPLACE FUNCTION public.guard_new_loan()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE equipment_status text; active_count integer;
BEGIN
  IF NEW.borrower_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'A collaborator can create loans only for themselves' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.borrower_id::text, 0));
  SELECT e.status INTO equipment_status FROM public.equipment e WHERE e.id = NEW.equipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipment does not exist'; END IF;
  IF equipment_status <> 'available' THEN RAISE EXCEPTION 'Equipment is not available'; END IF;
  IF EXISTS (SELECT 1 FROM public.loans l WHERE l.borrower_id = NEW.borrower_id AND l.returned_at IS NULL AND l.due_at < (now() AT TIME ZONE 'America/Sao_Paulo')::date) THEN
    RAISE EXCEPTION 'A borrower with an overdue loan cannot borrow another item';
  END IF;
  SELECT count(*) INTO active_count FROM public.loans l WHERE l.borrower_id = NEW.borrower_id AND l.returned_at IS NULL;
  IF active_count >= 4 THEN RAISE EXCEPTION 'A borrower cannot have more than five active loans'; END IF;
  RETURN NEW;
END;
$fn$;

