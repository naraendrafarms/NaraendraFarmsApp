-- Migration 755: read-only. Invoice NF/HHF/25-26/45 carries 50,400 eggs, but
-- the batch that received it took only 20,160 — and linking it appears to have
-- rewritten Eggs Set on two batches to the full invoice quantity. Find what the
-- batches hold now, and whether the audit log remembers what they held before.

SELECT 'dispatch' AS chk, d.id::text AS dispatch_id, d.invoice_no, d.dc_no,
       d.dispatch_date, d.total_dispatched, COALESCE(f.flock_no::text, '?') AS flock
FROM public.he_dispatch d LEFT JOIN public.flocks f ON f.id = d.flock_id
WHERE d.invoice_no ILIKE '%25-26/45%';

SELECT 'batches_on_it' AS chk, hb.id::text AS batch_id, hb.setting_date,
       hb.eggs_set, hb.hatchery_name, COALESCE(h.name, '') AS hatchery,
       hb.hatched_chicks, hb.created_at, hb.updated_at
FROM public.hatch_batches hb
LEFT JOIN public.hatcheries h ON h.id = hb.hatchery_id
WHERE hb.dispatch_id IN (SELECT id FROM public.he_dispatch WHERE invoice_no ILIKE '%25-26/45%')
ORDER BY hb.setting_date;

SELECT 'audit_trail' AS chk, a.changed_at, a.action, a.user_email, LEFT(COALESCE(a.summary,''), 200) AS summary
FROM public.audit_log a
WHERE a.table_name = 'hatch_batches'
  AND a.record_id IN (SELECT hb.id FROM public.hatch_batches hb
                      WHERE hb.dispatch_id IN (SELECT id FROM public.he_dispatch WHERE invoice_no ILIKE '%25-26/45%'))
ORDER BY a.changed_at DESC LIMIT 20;

-- Any other batch whose eggs_set exactly equals its invoice total is suspect
-- for the same reason: the form filled it in from the invoice.
SELECT 'exact_matches' AS chk, count(*)::int AS batches_equal_to_invoice_total
FROM public.hatch_batches hb
JOIN public.he_dispatch d ON d.id = hb.dispatch_id
WHERE hb.eggs_set = d.total_dispatched AND COALESCE(d.total_dispatched,0) > 0;
