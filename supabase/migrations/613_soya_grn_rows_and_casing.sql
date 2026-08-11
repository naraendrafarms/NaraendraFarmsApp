-- 612 set Item Master's Soya Transport Charges to kg (the transport rate is
-- entered per kg, so the GRN side was right). That flipped which rows are the
-- odd ones out: the remaining 4 differing GRN rows are Soya Transport Charges
-- booked as "Nos", not kg. On your ruling that this charge is ALWAYS entered
-- per kg, those 4 unit labels are wrong. Statement 4 prints their quantities so
-- anything that does not look like a kg figure is visible rather than hidden.
--
-- 612 also showed the last of the casing drift, one level up from the medicine
-- tables that were cleaned earlier:
--   item_master_units: kg=51, Nos=37, Dose=36, Ltr=21, ML=8, Kg=4, Gms=3, Mtrs=2, MT=1
--   stock_ledger:      ... LTR=1, Kg=1
-- Only the minority spellings move (Kg→kg, LTR→Ltr). Mtrs and MT are genuinely
-- different units and are left alone.
--
-- Worth recording: stock_ledger for medicine items now reads
-- kg=180, Ltr=174, Dose=143, Gms=59, Nos=53, ML=10 — the 479 'ml' rows reported
-- back in 604 are gone. The ledger follows medicine_usage, so repairing usage
-- repaired inventory too. Nothing further is needed there.

-- 1. The 4 Soya Transport Charges GRN rows booked as Nos → kg.
UPDATE public.grn g
SET unit = 'kg'
FROM public.items i
WHERE i.id = g.item_id
  AND i.name ILIKE '%soya%transport%'
  AND LOWER(TRIM(g.unit)) IS DISTINCT FROM 'kg';

-- 2. Item Master casing, minority spellings only.
UPDATE public.items
SET unit = CASE WHEN LOWER(TRIM(unit)) = 'kg' THEN 'kg'
                WHEN LOWER(TRIM(unit)) = 'ltr' THEN 'Ltr'
                WHEN LOWER(TRIM(unit)) = 'ml' THEN 'ML'
                WHEN LOWER(TRIM(unit)) = 'nos' THEN 'Nos'
                WHEN LOWER(TRIM(unit)) IN ('dose','doses') THEN 'Dose'
                WHEN LOWER(TRIM(unit)) IN ('gm','gms') THEN 'Gms'
                ELSE unit END
WHERE unit IS NOT NULL;

-- 3. Same for the stock ledger rows belonging to medicine items.
UPDATE public.stock_ledger
SET unit = CASE WHEN LOWER(TRIM(unit)) = 'kg' THEN 'kg'
                WHEN LOWER(TRIM(unit)) = 'ltr' THEN 'Ltr'
                WHEN LOWER(TRIM(unit)) = 'ml' THEN 'ML'
                WHEN LOWER(TRIM(unit)) = 'nos' THEN 'Nos'
                WHEN LOWER(TRIM(unit)) IN ('dose','doses') THEN 'Dose'
                WHEN LOWER(TRIM(unit)) IN ('gm','gms') THEN 'Gms'
                ELSE unit END
WHERE unit IS NOT NULL
  AND item_id IN (SELECT item_id FROM public.medicines_master WHERE item_id IS NOT NULL);

-- 4. Receipts: nothing should differ now. The Soya rows are printed with their
--    quantities so a figure that is not a kg figure stands out.
SELECT (SELECT COUNT(*) FROM public.grn g JOIN public.items i ON i.id = g.item_id
        WHERE LOWER(TRIM(g.unit)) IS DISTINCT FROM LOWER(TRIM(i.unit))) AS grn_rows_differing,
       (SELECT COALESCE(string_agg('grn ' || COALESCE(g.grn_no,'?') || ' ' || g.grn_date::text
          || ': ' || g.qty::text || ' ' || COALESCE(g.unit,'null'), ' | ' ORDER BY g.grn_date), 'NONE')
        FROM public.grn g JOIN public.items i ON i.id = g.item_id
        WHERE i.name ILIKE '%soya%transport%') AS soya_transport_rows;

-- 5. Final state of every unit surface, plus the medicines still not linked to
--    an item — named, since Item Master is the source of truth and an unlinked
--    medicine sits outside it.
SELECT (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.items GROUP BY 1) a) AS item_units,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(unit,'(null)') AS u, COUNT(*) AS c FROM public.medicine_usage GROUP BY 1) b) AS usage_units,
       (SELECT COALESCE(string_agg(u || '=' || c, ', ' ORDER BY c DESC), 'NONE') FROM (
          SELECT COALESCE(sl.unit,'(null)') AS u, COUNT(*) AS c FROM public.stock_ledger sl
          WHERE sl.item_id IN (SELECT item_id FROM public.medicines_master WHERE item_id IS NOT NULL)
          GROUP BY 1) c) AS ledger_units,
       (SELECT COALESCE(string_agg(name || '=' || COALESCE(unit,'null'), ', ' ORDER BY name), 'NONE')
        FROM public.medicines_master WHERE item_id IS NULL) AS medicines_without_item_link;
