-- Initial Emprest.AI equipment and loan schema.

CREATE TABLE public.equipment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag text UNIQUE,
    name text NOT NULL,
    category text NOT NULL,
    brand text,
    model text,
    status text NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'on_loan', 'maintenance')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.loans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id uuid NOT NULL
        REFERENCES public.equipment (id) ON DELETE RESTRICT,
    borrower_id uuid NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users (id) ON DELETE RESTRICT,
    borrowed_at timestamptz NOT NULL DEFAULT now(),
    due_at date NOT NULL DEFAULT (current_date + 14),
    returned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT loans_return_not_before_borrow
        CHECK (returned_at IS NULL OR returned_at >= borrowed_at)
);

CREATE UNIQUE INDEX loans_one_active_per_equipment
    ON public.loans (equipment_id)
    WHERE returned_at IS NULL;

CREATE INDEX loans_active_by_borrower
    ON public.loans (borrower_id, due_at)
    WHERE returned_at IS NULL;

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.equipment, public.loans FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipment TO authenticated;
GRANT SELECT ON TABLE public.loans TO authenticated;
GRANT INSERT (equipment_id) ON TABLE public.loans TO authenticated;
GRANT UPDATE (returned_at) ON TABLE public.loans TO authenticated;

CREATE POLICY equipment_catalog_read
    ON public.equipment
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY equipment_operations_manage
    ON public.equipment
    FOR ALL
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operations')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operations');

CREATE POLICY loans_read_own_or_operations
    ON public.loans
    FOR SELECT
    TO authenticated
    USING (
        borrower_id = (SELECT auth.uid())
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'operations'
    );

CREATE POLICY loans_create_for_self
    ON public.loans
    FOR INSERT
    TO authenticated
    WITH CHECK (borrower_id = (SELECT auth.uid()));

CREATE POLICY loans_return_own_or_operations
    ON public.loans
    FOR UPDATE
    TO authenticated
    USING (
        borrower_id = (SELECT auth.uid())
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'operations'
    )
    WITH CHECK (
        borrower_id = (SELECT auth.uid())
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'operations'
    );

CREATE FUNCTION public.guard_equipment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'on_loan' THEN
        RAISE EXCEPTION 'Equipment cannot be created as on_loan';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        IF NEW.status = 'on_loan'
           AND pg_trigger_depth() = 1
           AND NOT EXISTS (
               SELECT 1
               FROM public.loans AS l
               WHERE l.equipment_id = NEW.id
                 AND l.returned_at IS NULL
           ) THEN
            RAISE EXCEPTION 'Equipment can be marked on_loan only with an active loan';
        END IF;

        IF NEW.status IN ('available', 'maintenance')
           AND EXISTS (
               SELECT 1
               FROM public.loans AS l
               WHERE l.equipment_id = NEW.id
                 AND l.returned_at IS NULL
           ) THEN
            RAISE EXCEPTION 'Equipment with an active loan cannot become available or enter maintenance';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER equipment_status_guard
    BEFORE INSERT OR UPDATE OF status ON public.equipment
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_equipment_status();

CREATE FUNCTION public.guard_new_loan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    equipment_status text;
    active_count integer;
BEGIN
    IF NEW.borrower_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'A collaborator can create loans only for themselves'
            USING ERRCODE = '42501';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(NEW.borrower_id::text, 0)
    );

    SELECT e.status
      INTO equipment_status
      FROM public.equipment AS e
     WHERE e.id = NEW.equipment_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipment does not exist';
    END IF;

    IF equipment_status <> 'available' THEN
        RAISE EXCEPTION 'Equipment is not available';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.loans AS l
         WHERE l.borrower_id = NEW.borrower_id
           AND l.returned_at IS NULL
           AND l.due_at < current_date
    ) THEN
        RAISE EXCEPTION 'A borrower with an overdue loan cannot borrow another item';
    END IF;

    SELECT count(*)
      INTO active_count
      FROM public.loans AS l
     WHERE l.borrower_id = NEW.borrower_id
       AND l.returned_at IS NULL;

    IF active_count >= 3 THEN
        RAISE EXCEPTION 'A borrower cannot have more than three active loans';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER loans_guard_before_insert
    BEFORE INSERT ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_new_loan();

CREATE FUNCTION public.guard_loan_return()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.equipment_id IS DISTINCT FROM OLD.equipment_id
       OR NEW.borrower_id IS DISTINCT FROM OLD.borrower_id
       OR NEW.borrowed_at IS DISTINCT FROM OLD.borrowed_at
       OR NEW.due_at IS DISTINCT FROM OLD.due_at
       OR OLD.returned_at IS NOT NULL
       OR NEW.returned_at IS NULL
       OR NEW.returned_at < OLD.borrowed_at
       OR NEW.returned_at > now() THEN
        RAISE EXCEPTION 'Only an active loan may be returned, without changing its original details';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER loans_return_guard
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_loan_return();

CREATE FUNCTION public.sync_equipment_status_from_loan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.equipment
           SET status = 'on_loan'
         WHERE id = NEW.equipment_id;
    ELSIF OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
        UPDATE public.equipment
           SET status = 'available'
         WHERE id = NEW.equipment_id;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER loans_sync_equipment_after_change
    AFTER INSERT OR UPDATE OF returned_at ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_equipment_status_from_loan();
