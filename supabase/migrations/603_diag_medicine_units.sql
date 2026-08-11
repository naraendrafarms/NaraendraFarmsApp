-- Diagnostic only (no schema changes, no data changes).
--
-- Daily Summary prints every medicine as "=NNNml". The report itself is not at
-- fault: DailySummary.tsx line 267 renders `${quantity}${unit}` straight from
-- medicine_usage.unit. The unit is hardcoded on SAVE instead — BulkDailyEntry.tsx
-- lines 548, 676 and 1098 all send `unit: 'ml'` regardless of the medicine.
-- (DailyEntry.tsx, the single-flock page, copies medicines_master.unit correctly,
-- so the same medicine gets a different unit depending on which page saved it.)
--
-- Before changing anything, establish whether fixing the save is ENOUGH, or
-- whether the master itself is also wrong. medicines_master.unit is
-- DEFAULT 'ml' and the Add Medicine form opens pre-filled with 'ml', so a
-- medicine added without touching that field carries 'ml' in the master too —
-- in which case copying from the master would still produce 'ml'.
--
-- run_sql.py prints only the first 5 statements, and only those returning rows,
-- so this file is exactly 5 statements and each is aggregated to always
-- return one row.

-- 1. What units the MASTER holds, by type. If this is overwhelmingly 'ml',
--    the master needs correcting before any save-side fix can help.
SELECT COALESCE(string_agg(t || '/' || u || '=' || c, ', ' ORDER BY c DESC), 'NONE') AS master_units_by_type
FROM (
  SELECT COALESCE(type,'(null)') AS t, COALESCE(unit,'(null)') AS u, COUNT(*) AS c
  FROM public.medicines_master
  GROUP BY 1, 2
) x;

-- 2. Every active medicine with its master unit, so the wrong ones are nameable.
SELECT COALESCE(string_agg(name || ' [' || COALESCE(type,'?') || '] ' || COALESCE(unit,'(null)'), ' | ' ORDER BY name), 'NONE') AS master_list
FROM public.medicines_master
WHERE is_active IS NOT FALSE;

-- 3. What units are actually STORED on usage rows, and over what date span.
SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') AS usage_units,
       (SELECT COUNT(*) FROM public.medicine_usage) AS usage_rows,
       (SELECT MIN(usage_date)::text || ' to ' || MAX(usage_date)::text FROM public.medicine_usage) AS usage_span
FROM (
  SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c
  FROM public.medicine_usage
  GROUP BY 1
) y;

-- 4. The decisive number: usage rows whose stored unit DISAGREES with the
--    master unit of the medicine they point at. These are the rows a backfill
--    would have to correct, and they are the ones printing wrongly today.
SELECT COUNT(*) AS usage_rows_total,
       COUNT(*) FILTER (WHERE u.unit IS DISTINCT FROM m.unit) AS disagree_with_master,
       COUNT(*) FILTER (WHERE u.unit = 'ml' AND m.unit IS DISTINCT FROM 'ml') AS saved_as_ml_but_master_says_otherwise,
       COUNT(*) FILTER (WHERE m.id IS NULL) AS orphan_no_master
FROM public.medicine_usage u
LEFT JOIN public.medicines_master m ON m.id = u.medicine_id;

-- 5. The five medicines named in the report, by name, so their master unit is
--    visible directly. ILIKE because the stored names may carry spacing/case
--    differences ("Vitalosin 62.5 %" vs "Vitalosin 62.5%").
SELECT COALESCE(string_agg(
         m.name || ' → master=' || COALESCE(m.unit,'(null)') ||
         ' usage=' || COALESCE((SELECT string_agg(DISTINCT COALESCE(u.unit,'(null)'), '/')
                                FROM public.medicine_usage u WHERE u.medicine_id = m.id), '(never used)'),
         ' | ' ORDER BY m.name), 'NONE MATCHED') AS reported_medicines
FROM public.medicines_master m
WHERE m.name ILIKE '%fertimax%' OR m.name ILIKE '%vitalosin%' OR m.name ILIKE '%bvclo%'
   OR m.name ILIKE '%eveect%' OR m.name ILIKE '%biospark%';
