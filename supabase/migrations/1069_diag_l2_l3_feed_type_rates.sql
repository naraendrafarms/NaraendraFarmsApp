SELECT ft.code, ft.id::text,
  (SELECT count(*)::int FROM public.feed_formulas ff WHERE ff.feed_type_id = ft.id) AS n_formulas,
  (SELECT count(*)::int FROM public.feed_formulas ff WHERE ff.feed_type_id = ft.id AND ff.is_active) AS n_active_formulas
FROM public.feed_types ft
WHERE ft.code IN ('L1','L2','L3','BGM','BCM','PBM','BDM','MALE')
ORDER BY ft.code;
