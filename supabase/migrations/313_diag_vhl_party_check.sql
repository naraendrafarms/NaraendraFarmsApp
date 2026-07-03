-- hatchery_id was null for all Flock 20 dispatches (312) — VHL isn't
-- identified via that field. Check he_dispatch.party_id -> parties.name
-- instead (the buyer/customer on the dispatch), and also check flocks
-- table itself for any hatchery/customer-linkage column.
SELECT d.dc_no, d.boxes_20lb, d.boxes_23lb, d.extra_trays_20lb, d.extra_trays_23lb,
       p.name AS party_name, p.type AS party_type
FROM public.he_dispatch d
JOIN public.flocks f ON f.id = d.flock_id
LEFT JOIN public.parties p ON p.id = d.party_id
WHERE f.flock_no = '20'
ORDER BY d.dispatch_date;

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='flocks'
  AND (column_name ILIKE '%hatch%' OR column_name ILIKE '%vhl%' OR column_name ILIKE '%customer%');
