-- Apply the imported FY25-26 credits to the invoices they paid.
--
-- THE CUTOFFS ARE THE OWNER'S OWN: "From 18/08/2025 started jamal and
-- 01-09-2025 started hitech for flock 19". The money agrees with him almost
-- exactly - Hitech credits from 01/09/2025 onward total Rs 26,47,16,158
-- against Rs 26.47 cr owed net of TDS, a gap of Rs 16,158 or 0.006%.
--
-- SO THE 31 HITECH CREDITS BEFORE 01/09/2025 (Rs 6,07,86,171) ARE LEFT ALONE.
-- They pre-date Flock 19 and belong to invoices already settled. A plain
-- oldest-first sweep over all 104 credits would have pushed April money onto
-- September invoices, marking the wrong ones paid and leaving Rs 6 cr adrift.
--
-- HITECH BREEDING FARMS (23/12/2025, Rs 19,14,298) is a DIFFERENT COMPANY and
-- carries no party, so it cannot be drawn on here.
--
-- THE RULE: oldest invoice first, each settled to its NET balance
-- (amount - TDS - already received), money drawn from that buyer's credits in
-- date order. Same rule Bulk Receipt uses, same net-of-TDS convention measured
-- across 79 invoices earlier. Jamal's Rs 20.72 L cannot cover Rs 32.12 L, so
-- his last invoices stay Partial - the shortfall is reported, never invented.

CREATE TABLE IF NOT EXISTS public.he_dispatch_backup_1382 AS
SELECT * FROM public.he_dispatch d
 WHERE d.party_id IN ('436decba-1b4f-4dbe-91fa-e8c9d794e095','cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0')
   AND (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) > 0.005;

CREATE TABLE IF NOT EXISTS public.bank_transactions_backup_1382 AS
SELECT * FROM public.bank_transactions b
 WHERE b.txn_type = 'Credit' AND b.he_dispatch_id IS NULL AND b.nhe_sale_id IS NULL
   AND ( (b.party_id = '436decba-1b4f-4dbe-91fa-e8c9d794e095' AND b.txn_date >= '2025-09-01')
      OR (b.party_id = 'cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0' AND b.txn_date >= '2025-08-18') );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.he_dispatch_backup_1382 TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions_backup_1382 TO anon, authenticated, service_role;

DO $$
DECLARE
  v_inv RECORD; v_cr RECORD; v_take NUMERIC; v_left NUMERIC;
  v_hit UUID := '436decba-1b4f-4dbe-91fa-e8c9d794e095';
  v_jam UUID := 'cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0';
BEGIN
  -- Defensive: a temp table left behind would make CREATE raise "already
  -- exists", which run_sql.py counts as SUCCESS - the allocation would then
  -- silently not run while the log said Errors: 0.
  DROP TABLE IF EXISTS _pool;
  CREATE TEMP TABLE _pool ON COMMIT DROP AS
  SELECT b.id, b.txn_date, b.party_id, b.reference_no, b.bank_account_id,
         b.amount AS remaining
    FROM public.bank_transactions b
   WHERE b.txn_type = 'Credit' AND b.he_dispatch_id IS NULL AND b.nhe_sale_id IS NULL
     AND ( (b.party_id = v_hit AND b.txn_date >= '2025-09-01')
        OR (b.party_id = v_jam AND b.txn_date >= '2025-08-18') );

  FOR v_inv IN
    SELECT d.id, d.party_id, d.amount, COALESCE(d.tds_amount,0) AS tds,
           (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) AS net_due
      FROM public.he_dispatch d
     WHERE d.party_id IN (v_hit, v_jam)
       AND (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) > 0.005
     ORDER BY d.dispatch_date, d.id
  LOOP
    v_left := ROUND(v_inv.net_due, 2);
    FOR v_cr IN
      SELECT * FROM _pool WHERE party_id = v_inv.party_id AND remaining > 0.005
       ORDER BY txn_date, id
    LOOP
      EXIT WHEN v_left <= 0.005;
      v_take := ROUND(LEAST(v_cr.remaining, v_left), 2);
      CONTINUE WHEN v_take <= 0.005;

      INSERT INTO public.bank_txn_settlements (bank_txn_id, source, invoice_id, amount, settled_on)
      VALUES (v_cr.id, 'he_dispatch', v_inv.id, v_take, v_cr.txn_date);

      UPDATE _pool SET remaining = remaining - v_take WHERE id = v_cr.id;

      UPDATE public.bank_transactions
         SET settled_amount = COALESCE(settled_amount, 0) + v_take,
             he_dispatch_id = COALESCE(he_dispatch_id, v_inv.id)
       WHERE id = v_cr.id;

      UPDATE public.he_dispatch
         SET amount_received = COALESCE(amount_received, 0) + v_take,
             received_date   = v_cr.txn_date,
             payment_mode    = 'NEFT',
             bank_account_id = v_cr.bank_account_id,
             utr_ref         = COALESCE(utr_ref, v_cr.reference_no),
             payment_status  = CASE
               WHEN COALESCE(amount_received,0) + v_take
                    >= ROUND(amount - COALESCE(tds_amount,0), 2) - 0.005
               THEN 'Received' ELSE 'Partial' END
       WHERE id = v_inv.id;

      v_left := ROUND(v_left - v_take, 2);
    END LOOP;
  END LOOP;
END
$$;
