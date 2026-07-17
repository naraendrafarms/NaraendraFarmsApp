SELECT vs.sno, vs.age_label, vs.vaccine_name, mm.name AS linked_medicine_name
FROM public.vaccination_schedule vs
JOIN public.medicines_master mm ON mm.id = vs.medicine_id
WHERE lower(trim(vs.vaccine_name)) = lower(trim(mm.name))
ORDER BY vs.sno;
