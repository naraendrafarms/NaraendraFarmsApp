-- Read-only. Pre-import checks for the Flock 20 Hitech HE upload (Dec-2025 -> May-2026).
-- Confirms: flock identity, DC/invoice collisions against live he_dispatch,
-- the tds_pct actually used for Hitech elsewhere, and the Hitech party master row.

-- 1. Flock 20 identity + what HE it already holds
SELECT f.id::text AS flock_id, f.flock_no::text AS flock_no,
       count(d.id)::int AS he_rows,
       COALESCE(min(d.dispatch_date)::text,'-') || ' -> ' || COALESCE(max(d.dispatch_date)::text,'-') AS span,
       COALESCE(min(d.dc_no)::text,'-') || ' .. ' || COALESCE(max(d.dc_no)::text,'-') AS dc_range,
       COALESCE(sum(d.total_dispatched),0)::bigint AS eggs
FROM public.flocks f
LEFT JOIN public.he_dispatch d ON d.flock_id = f.id
WHERE f.flock_no::text = '20'
GROUP BY f.id, f.flock_no;

-- 2. DC collisions: any of the 72 upload DCs already present anywhere in he_dispatch
SELECT count(*)::int AS colliding_dc_rows,
       COALESCE(string_agg(DISTINCT d.dc_no::text, ',' ORDER BY d.dc_no::text), 'NONE') AS which_dcs
FROM public.he_dispatch d
WHERE d.dc_no IN (3861,3863,3864,3865,3867,3868,3870,3871,3872,3873,3874,3875,3876,3878,
 3879,3880,3881,3882,3883,3884,3885,3886,3887,3889,3890,3891,3892,3893,3894,3895,3896,
 3898,3899,3900,4601,4602,4603,4604,4605,4606,4607,4608,4609,4610,4611,4612,4613,4614,
 4615,4616,4617,4618,4619,4620,4621,4622,4623,4624,4625,4626,4627,4628,4629,4630,4631,
 4632,4633,4634,4635,4636,4637,4638);

-- 3. Invoice-number collisions for the 72 upload invoices
SELECT count(*)::int AS colliding_invoice_rows,
       COALESCE(string_agg(d.invoice_no || '@' || d.dispatch_date::text, ', ' ORDER BY d.invoice_no), 'NONE') AS which
FROM public.he_dispatch d
WHERE d.invoice_no LIKE 'NF/HHF/25-26/%' OR d.invoice_no LIKE 'NF/HHF/26-27/%';

-- 4. What tds_pct is actually stored today, by party
SELECT COALESCE(p.name,'(no party)') AS party,
       count(*)::int AS rows,
       string_agg(DISTINCT COALESCE(d.tds_pct::text,'null'), '/') AS tds_pcts,
       round(sum(COALESCE(d.tds_amount,0))::numeric,2) AS tds_total
FROM public.he_dispatch d
LEFT JOIN public.parties p ON p.id = d.party_id
GROUP BY p.name ORDER BY 2 DESC;

-- 5. The Hitech party master row
SELECT id::text, name, type, COALESCE(tds_pct_default::text,'null') AS tds_default,
       COALESCE(pan_no,'-') AS pan, COALESCE(deductee_type,'-') AS deductee
FROM public.parties WHERE name ILIKE '%hitech%';
