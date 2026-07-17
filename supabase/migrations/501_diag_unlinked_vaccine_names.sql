-- Which Vaccination Schedule / Vaccination Records vaccine names have no
-- matching (or manually linked) Medicines Master entry?
SELECT vs.age_label, vs.vaccine_name
FROM public.vaccination_schedule vs
WHERE vs.medicine_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.medicines_master mm
    WHERE lower(trim(mm.name)) = lower(trim(vs.vaccine_name))
  )
ORDER BY vs.vaccine_name;

SELECT count(*) AS total_schedule_rows,
  count(*) FILTER (WHERE medicine_id IS NOT NULL) AS linked,
  count(*) FILTER (WHERE medicine_id IS NULL) AS unlinked
FROM public.vaccination_schedule;

SELECT count(DISTINCT vr.vaccine_name) AS distinct_unmatched_record_names
FROM public.vaccination_records vr
WHERE vr.medicine_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.medicines_master mm
    WHERE lower(trim(mm.name)) = lower(trim(vr.vaccine_name))
  );
