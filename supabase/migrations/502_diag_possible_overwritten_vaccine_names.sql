-- Rows where vaccine_name now exactly equals its linked medicine's own
-- name are the ones that MIGHT have been overwritten by the old buggy
-- "Link to Medicines Master" behavior (before this session's fix) --
-- not proof, since a row linked with nothing typed yet would also show
-- this, but it's the closest signal available (no audit trail exists).
SELECT vs.id, vs.age_label, vs.vaccine_name, mm.name AS linked_medicine_name, vs.created_at
FROM public.vaccination_schedule vs
JOIN public.medicines_master mm ON mm.id = vs.medicine_id
WHERE lower(trim(vs.vaccine_name)) = lower(trim(mm.name))
ORDER BY vs.created_at DESC;

SELECT vr.id, vr.vaccine_date, vr.vaccine_name, mm.name AS linked_medicine_name, vr.created_at
FROM public.vaccination_records vr
JOIN public.medicines_master mm ON mm.id = vr.medicine_id
WHERE vr.source_medicine_usage_id IS NULL
  AND lower(trim(vr.vaccine_name)) = lower(trim(mm.name))
ORDER BY vr.created_at DESC
LIMIT 20;
