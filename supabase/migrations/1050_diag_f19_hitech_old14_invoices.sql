SELECT string_agg(d.dc_no||'|'||d.invoice_no, ';' ORDER BY d.dc_no)
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
WHERE d.flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2'::uuid
  AND p.name = 'Hitech Hatch Fresh Private Limited'
  AND d.dc_no BETWEEN 3429 AND 3442;
