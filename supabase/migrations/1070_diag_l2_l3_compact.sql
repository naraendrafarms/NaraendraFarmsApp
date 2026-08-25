SELECT string_agg(ft.code || '=' || (
  SELECT count(*)::int FROM public.feed_formulas ff WHERE ff.feed_type_id = ft.id AND ff.is_active
), ', ' ORDER BY ft.code) AS active_formula_counts
FROM public.feed_types ft
WHERE ft.code IN ('L1','L2','L3','BGM','BCM','PBM','BDM','MALE');
