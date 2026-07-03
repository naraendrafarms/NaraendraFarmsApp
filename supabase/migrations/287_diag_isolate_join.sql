-- Isolate which part of the backfill SELECT eliminates all rows: plain JOIN
-- first (no LATERAL, no GROUP BY), then add GROUP BY, then add LATERAL.
SELECT p.name, p.id, g.grn_no, g.total_amount, g.basic_amount, g.po_no
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
WHERE g.grn_no IN ('2758','2759','2760','2761');

SELECT p.name, p.id, g.grn_no, SUM(COALESCE(g.total_amount, g.basic_amount, 0)) AS total
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
WHERE g.grn_no IN ('2758','2759','2760','2761')
GROUP BY p.name, p.id, g.grn_no;
