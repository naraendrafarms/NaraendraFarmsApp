SELECT count(*) AS trigger_exists FROM pg_trigger WHERE tgname='trg_medicines_master_set_item_id';
SELECT count(*) AS total_medicines, count(item_id) AS linked, count(*) - count(item_id) AS unlinked
FROM public.medicines_master;
SELECT name FROM public.medicines_master WHERE item_id IS NULL ORDER BY name LIMIT 30;
