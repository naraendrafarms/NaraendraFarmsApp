SELECT COUNT(*) AS null_item_id_remaining FROM public.medicine_usage WHERE item_id IS NULL;
SELECT count(*) AS trigger_exists FROM pg_trigger WHERE tgname = 'trg_medicine_usage_set_item_id';
-- Confirm Flock 22's Vitalosin usage is now linked and its stock_ledger row matches
SELECT mu.id, mu.usage_date, mu.quantity, mu.item_id, f.flock_no
FROM public.medicine_usage mu
JOIN public.flocks f ON f.id = mu.flock_id
JOIN public.medicines_master mm ON mm.id = mu.medicine_id
WHERE mm.name ILIKE '%vitalosin%' AND f.flock_no::text = '22'
ORDER BY mu.usage_date DESC
LIMIT 10;
