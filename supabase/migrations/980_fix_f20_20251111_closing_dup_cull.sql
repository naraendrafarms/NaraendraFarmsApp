-- Migration 980: fix Flock 20, 2025-11-11 -- closing_female/closing_male on all
-- 7 Bodjanampet-1 sheds + Kethireddypally shed 2 were computed by subtracting
-- trcull twice (once as trcull_female/male, again via its exact duplicate in
-- transfer_female/male -- the same duplicate-column bug flagged in the
-- Opus-5 audit, migration 964). Verified against the farm owner's own figures
-- for shed 2 (opening 5777/675, matching this formula exactly). trcull/transfer
-- values themselves are untouched -- only closing is recomputed as
-- opening - trcull - mortality (single subtraction). The already-enabled
-- fn_chain_cascade trigger will propagate the corrected closing into
-- 2025-11-12's opening for the same sheds.
UPDATE public.daily_records d
SET closing_female = d.opening_female - d.trcull_female - d.mortality_female,
    closing_male   = d.opening_male   - d.trcull_male   - d.mortality_male
FROM public.flocks fl, public.sheds s, public.farms fm
WHERE d.flock_id = fl.id AND d.shed_id = s.id AND s.farm_id = fm.id
  AND fl.flock_no::text = '20' AND d.record_date = '2025-11-11'
  AND (fm.name = 'Bodjanampet - 1' OR (fm.name = 'Kethireddypally' AND s.shed_no = '2'));

SELECT 'f20_20251111_fixed' AS chk,
  string_agg(fm.name || ' sh' || s.shed_no || ': close(' || d.closing_female || '/' || d.closing_male || ')',
    ' | ' ORDER BY fm.name, s.shed_no::int) AS rows
FROM public.daily_records d
JOIN public.flocks fl ON fl.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND d.record_date = '2025-11-11'
  AND (fm.name = 'Bodjanampet - 1' OR (fm.name = 'Kethireddypally' AND s.shed_no = '2'));
