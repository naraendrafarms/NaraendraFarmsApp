-- Migration 757: read-only. Both batches on invoice NF/HHF/25-26/45 read
-- 50,400. Before setting one to 20,160 and the other to 10,080, look at what
-- else each holds — hatchery and chicks — because the eggs must be paired with
-- the RIGHT batch or the hatch percentage moves to the wrong setting.

SELECT 'batch' AS chk, hb.id::text AS batch_id, hb.setting_date, hb.hatch_date,
       hb.eggs_set, hb.hatched_chicks, hb.fertile_eggs, hb.setting_no,
       COALESCE(h.name, hb.hatchery_name, '(none)') AS hatchery, hb.created_at
FROM public.hatch_batches hb
LEFT JOIN public.hatcheries h ON h.id = hb.hatchery_id
WHERE hb.dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')
ORDER BY hb.created_at;
