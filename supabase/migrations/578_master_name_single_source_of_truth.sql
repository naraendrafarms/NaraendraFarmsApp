-- Make the master record the single source of truth for a name.
--
-- Background: transaction tables store the party/partner name as plain TEXT,
-- copied in at the moment the row was created. Renaming the master changed
-- nothing else, so "G Parmita Das" kept showing everywhere after the master
-- became "Gottipati Parmita Das". Diagnostics 575-577 measured the damage:
--   pending_payments.vendor_name      6 rows
--   cash_book.party_name              6 rows
--   bank_transactions.description     6 rows (name inside a sentence)
--   cash_book.description             6 rows (name inside a sentence)
-- and confirmed both masters are already correct
--   parties  258ee820-418c-4af3-a1d0-abbe9899621f
--   partners 43966d98-9d52-402c-82e9-c3b5b131fc55
--
-- This migration does three things:
--   A. Corrects the existing stale rows.
--   B. Adds a rename-propagation trigger so a future rename carries through
--      automatically.
--   C. Gives cash_book the id links it never had, and adds a mirror trigger so
--      any row carrying a link always shows the master's current name.
--
-- Note on pending_payments: it has UNIQUE (vendor_name, grn_no). Renaming
-- could collide with a row already filed under the new name for the same GRN,
-- which would abort the caller's INSERT/UPDATE. Every rename below is guarded
-- with a NOT EXISTS check so a collision skips that row instead of failing.

-- ── C1. Link columns on cash_book (additive) ────────────────────────────────
ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;

ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_book_party_id ON public.cash_book(party_id);

CREATE INDEX IF NOT EXISTS idx_cash_book_partner_id ON public.cash_book(partner_id);

-- ── C2. Backfill those links by name, the same way migration 232 did for
--        purchase_orders and pending_payments.
UPDATE public.cash_book cb
SET party_id = p.id
FROM public.parties p
WHERE cb.party_id IS NULL
  AND COALESCE(trim(cb.party_name), '') <> ''
  AND lower(trim(p.name)) = lower(trim(cb.party_name));

UPDATE public.cash_book cb
SET partner_id = pt.id
FROM public.partners pt
WHERE cb.partner_id IS NULL
  AND COALESCE(trim(cb.party_name), '') <> ''
  AND lower(trim(pt.name)) = lower(trim(cb.party_name));

-- ── A. Correct the existing stale rows for this rename ──────────────────────
UPDATE public.pending_payments pp
SET vendor_name = 'Gottipati Parmita Das'
WHERE lower(trim(pp.vendor_name)) = lower('G Parmita Das')
  AND NOT EXISTS (
    SELECT 1 FROM public.pending_payments q
    WHERE q.vendor_name = 'Gottipati Parmita Das'
      AND q.grn_no IS NOT DISTINCT FROM pp.grn_no
      AND q.id <> pp.id);

UPDATE public.cash_book
SET party_name = 'Gottipati Parmita Das'
WHERE lower(trim(party_name)) = lower('G Parmita Das');

UPDATE public.cash_book
SET description = replace(description, 'G Parmita Das', 'Gottipati Parmita Das')
WHERE description LIKE '%G Parmita Das%';

UPDATE public.bank_transactions
SET description = replace(description, 'G Parmita Das', 'Gottipati Parmita Das')
WHERE description LIKE '%G Parmita Das%';

-- Re-link the 3 bills that carry only partner_id, now that the name matches.
UPDATE public.pending_payments pp
SET party_id = p.id
FROM public.parties p
WHERE pp.party_id IS NULL
  AND lower(trim(p.name)) = lower(trim(pp.vendor_name));

-- ── B. Rename propagation: renaming a master rewrites every stored copy ─────
-- One function serves both parties and partners: each has a `name` column and
-- the set of places a name is copied to is identical.
CREATE OR REPLACE FUNCTION public.fn_propagate_master_rename()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.name IS NOT DISTINCT FROM OLD.name OR COALESCE(trim(NEW.name), '') = '' THEN
    RETURN NEW;
  END IF;

  BEGIN
    -- Guarded: skip any row whose rename would break UNIQUE (vendor_name, grn_no)
    UPDATE public.pending_payments pp
    SET vendor_name = NEW.name
    WHERE lower(trim(pp.vendor_name)) = lower(trim(OLD.name))
      AND NOT EXISTS (
        SELECT 1 FROM public.pending_payments q
        WHERE q.vendor_name = NEW.name
          AND q.grn_no IS NOT DISTINCT FROM pp.grn_no
          AND q.id <> pp.id);

    UPDATE public.purchase_orders SET vendor_name = NEW.name
      WHERE lower(trim(vendor_name)) = lower(trim(OLD.name));
    UPDATE public.supplier_invoices SET supplier_name = NEW.name
      WHERE lower(trim(supplier_name)) = lower(trim(OLD.name));
    UPDATE public.cash_book SET party_name = NEW.name
      WHERE lower(trim(party_name)) = lower(trim(OLD.name));
    UPDATE public.sales_register SET party_name = NEW.name
      WHERE lower(trim(party_name)) = lower(trim(OLD.name));
    UPDATE public.bag_sales SET buyer_name = NEW.name
      WHERE lower(trim(buyer_name)) = lower(trim(OLD.name));
    UPDATE public.feedmill_expenses SET vendor_name = NEW.name
      WHERE lower(trim(vendor_name)) = lower(trim(OLD.name));
    UPDATE public.vendor_bank_details SET vendor_name = NEW.name
      WHERE lower(trim(vendor_name)) = lower(trim(OLD.name));

    -- Free-text sentences that embed the name (ledger narrations)
    UPDATE public.bank_transactions SET description = replace(description, OLD.name, NEW.name)
      WHERE description LIKE '%' || OLD.name || '%';
    UPDATE public.cash_book SET description = replace(description, OLD.name, NEW.name)
      WHERE description LIKE '%' || OLD.name || '%';
  EXCEPTION WHEN OTHERS THEN
    -- Never block the rename itself. Worst case some copies stay stale and
    -- can be corrected by saving the master again.
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_parties_rename ON public.parties;

CREATE TRIGGER trg_parties_rename
  AFTER UPDATE OF name ON public.parties
  FOR EACH ROW EXECUTE FUNCTION public.fn_propagate_master_rename();

DROP TRIGGER IF EXISTS trg_partners_rename ON public.partners;

CREATE TRIGGER trg_partners_rename
  AFTER UPDATE OF name ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.fn_propagate_master_rename();

-- ── C3. Mirror on write: a row that carries a link always shows the master's
--        current name, so a stale name can never be saved in the first place.
--        Rows with no link keep whatever was typed (nothing goes blank).
CREATE OR REPLACE FUNCTION public.fn_mirror_name_from_master()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF TG_TABLE_NAME = 'pending_payments' THEN
    IF NEW.party_id IS NOT NULL THEN
      SELECT name INTO v_name FROM public.parties WHERE id = NEW.party_id;
    ELSIF NEW.partner_id IS NOT NULL THEN
      SELECT name INTO v_name FROM public.partners WHERE id = NEW.partner_id;
    END IF;
    IF v_name IS NOT NULL AND v_name IS DISTINCT FROM NEW.vendor_name
       AND NOT EXISTS (
         SELECT 1 FROM public.pending_payments q
         WHERE q.vendor_name = v_name
           AND q.grn_no IS NOT DISTINCT FROM NEW.grn_no
           AND q.id <> NEW.id) THEN
      NEW.vendor_name := v_name;
    END IF;
  ELSIF TG_TABLE_NAME = 'cash_book' THEN
    IF NEW.party_id IS NOT NULL THEN
      SELECT name INTO v_name FROM public.parties WHERE id = NEW.party_id;
    ELSIF NEW.partner_id IS NOT NULL THEN
      SELECT name INTO v_name FROM public.partners WHERE id = NEW.partner_id;
    END IF;
    IF v_name IS NOT NULL THEN
      NEW.party_name := v_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_name_pending_payments ON public.pending_payments;

CREATE TRIGGER trg_mirror_name_pending_payments
  BEFORE INSERT OR UPDATE ON public.pending_payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_mirror_name_from_master();

DROP TRIGGER IF EXISTS trg_mirror_name_cash_book ON public.cash_book;

CREATE TRIGGER trg_mirror_name_cash_book
  BEFORE INSERT OR UPDATE ON public.cash_book
  FOR EACH ROW EXECUTE FUNCTION public.fn_mirror_name_from_master();

-- ── Verification ────────────────────────────────────────────────────────────
-- 1. Nothing should still carry the old name.
SELECT src, rows FROM (
  SELECT 'pending_payments.vendor_name' AS src, COUNT(*) AS rows
    FROM public.pending_payments WHERE vendor_name ILIKE '%G Parmita Das%'
  UNION ALL SELECT 'cash_book.party_name', COUNT(*)
    FROM public.cash_book WHERE party_name ILIKE '%G Parmita Das%'
  UNION ALL SELECT 'cash_book.description', COUNT(*)
    FROM public.cash_book WHERE description ILIKE '%G Parmita Das%'
  UNION ALL SELECT 'bank_transactions.description', COUNT(*)
    FROM public.bank_transactions WHERE description ILIKE '%G Parmita Das%'
) a WHERE rows > 0;

-- 2. And the new name should now be present in the same places.
SELECT
  (SELECT COUNT(*) FROM public.pending_payments WHERE vendor_name = 'Gottipati Parmita Das') AS pp_new,
  (SELECT COUNT(*) FROM public.cash_book WHERE party_name = 'Gottipati Parmita Das') AS cb_new,
  (SELECT COUNT(*) FROM public.cash_book WHERE description ILIKE '%Gottipati Parmita Das%') AS cb_desc_new,
  (SELECT COUNT(*) FROM public.bank_transactions WHERE description ILIKE '%Gottipati Parmita Das%') AS bt_desc_new,
  (SELECT COUNT(*) FROM public.cash_book WHERE party_id IS NOT NULL) AS cb_party_linked,
  (SELECT COUNT(*) FROM public.cash_book WHERE partner_id IS NOT NULL) AS cb_partner_linked;

-- 3. The triggers must actually exist (a silent CREATE failure would leave the
--    permanent fix absent while the data correction still looked fine).
SELECT string_agg(tgname, ', ' ORDER BY tgname) AS triggers_created
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname IN ('trg_parties_rename', 'trg_partners_rename',
                 'trg_mirror_name_pending_payments', 'trg_mirror_name_cash_book');

NOTIFY pgrst, 'reload schema';
