-- Migration 359: standalone verification of migration 358 (kept to 2 statements
-- so run_sql.py's first-5 print limit doesn't swallow the results).
SELECT flock_no, is_vhl_contract, laying_farm_id, rearing_farm_id FROM public.flocks WHERE flock_no = '21';
SELECT name, code, type, is_active FROM public.farms WHERE name = 'Bodjanampet-2';
