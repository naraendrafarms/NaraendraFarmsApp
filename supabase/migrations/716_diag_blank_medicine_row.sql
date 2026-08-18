-- Migration 716: read-only. Trace the single blank-named ledger row (a
-- medicine_out of 72,500 on 30/06/2026) back to the usage entry it came from,
-- so it can be named rather than guessed at.

SELECT 'usage_behind_blank' AS chk,
       mu.id::text AS usage_id, mu.usage_date, mu.quantity, mu.unit, mu.rate, mu.amount,
       COALESCE(mm.name, '(medicine not set)') AS medicine, mu.medicine_id::text AS medicine_id,
       COALESCE(f.flock_no::text, '(no flock)') AS flock, LEFT(COALESCE(mu.remarks,''), 60) AS remarks
FROM public.stock_ledger sl
JOIN public.medicine_usage mu ON mu.id = sl.med_usage_id
LEFT JOIN public.medicines_master mm ON mm.id = mu.medicine_id
LEFT JOIN public.flocks f ON f.id = mu.flock_id
WHERE COALESCE(btrim(sl.item_name), '') = '';
