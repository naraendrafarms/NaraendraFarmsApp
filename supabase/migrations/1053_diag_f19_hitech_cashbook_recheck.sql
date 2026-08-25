SELECT count(*)::int AS n FROM public.cash_book WHERE he_dispatch_id IS NOT NULL;
SELECT count(*)::int AS n_linked FROM public.cash_book cb
JOIN public.he_dispatch d ON d.id = cb.he_dispatch_id
WHERE d.flock_id = 'd07f7336-7e6f-4cdb-841d-059fea1643b2'::uuid;
