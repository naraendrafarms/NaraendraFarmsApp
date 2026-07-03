-- 288 showed 37 columns but the preview only printed the first 5 (id,
-- grn_no, grn_date, farm_id, party_id) — need to know specifically whether
-- any po-linking column exists and under what name.
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='grn'
  AND column_name ILIKE '%po%';
