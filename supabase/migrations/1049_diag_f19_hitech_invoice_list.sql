SELECT dc_no, invoice_no, amount, tds_amount
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
WHERE d.flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2'::uuid
  AND p.name = 'Hitech Hatch Fresh Private Limited'
ORDER BY d.dc_no;
