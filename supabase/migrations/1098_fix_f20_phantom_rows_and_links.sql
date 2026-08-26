-- Migration 1098: Remove Flock 20 phantom rows + vacated-shed links.
--
-- Flock 20 left Kethireddypally in Dec 2025 and lays only at Bodjanampet - 1.
-- Migration 985 re-added a flock_sheds link for Kethireddypally Shed 2, which
-- put vacated sheds back into Bulk Daily Entry. Saving that grid on 2026-08-25
-- wrote a row for every linked shed, including 5 rows in sheds Flock 20 does
-- not occupy. One of them (Kethireddypally Sh2) carried the stale 26/12/2025
-- closing of 1029F/34M, inflating v_flock_summary from 31531/3135 to
-- 32560/3169.
--
-- Chain triggers are disabled first: they chain opening/closing by shed_id
-- across flocks, and Kethireddypally Sh2 is shared with Flock 22's LIVE rows.
-- Nothing at Bodjanampet - 1 and nothing belonging to Flock 22 is touched.

ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_cascade;

ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_daily_opening;

DELETE FROM public.daily_records d
USING public.sheds s, public.farms fm
WHERE d.shed_id = s.id AND s.farm_id = fm.id
  AND d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND d.record_date >= '2026-01-01'
  AND fm.name <> 'Bodjanampet - 1'
RETURNING fm.name AS deleted_farm, s.shed_no AS deleted_shed,
          d.record_date::text AS deleted_date,
          COALESCE(d.closing_female,0) AS cf, COALESCE(d.closing_male,0) AS cm;

DELETE FROM public.flock_sheds fs
USING public.sheds s, public.farms fm
WHERE fs.shed_id = s.id AND s.farm_id = fm.id
  AND fs.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND fm.name <> 'Bodjanampet - 1'
RETURNING fm.name AS unlinked_farm, s.shed_no AS unlinked_shed;

ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_cascade;

ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_daily_opening;
