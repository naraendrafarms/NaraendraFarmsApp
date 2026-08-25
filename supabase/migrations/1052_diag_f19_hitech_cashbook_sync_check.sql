SELECT count(*)::int AS n_cashbook_rows, count(*) FILTER (WHERE cb.amount <> d.amount)::int AS n_mismatched
FROM public.cash_book cb
JOIN public.he_dispatch d ON d.id = cb.he_dispatch_id
JOIN public.parties p ON p.id = d.party_id
WHERE d.flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2'::uuid
  AND p.name = 'Hitech Hatch Fresh Private Limited';
