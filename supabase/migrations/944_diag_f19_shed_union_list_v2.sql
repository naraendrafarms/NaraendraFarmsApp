SELECT string_agg(
  fm.name || ' sh' || s.shed_no ||
    CASE WHEN EXISTS(SELECT 1 FROM public.daily_records d WHERE d.shed_id=s.id AND d.flock_id=fl.id)
         THEN '' ELSE ' [NO daily_records]' END,
  ' | ' ORDER BY fm.name, s.shed_no::int
) AS rows
FROM public.flocks fl
JOIN public.sheds s ON (
  EXISTS(SELECT 1 FROM public.flock_sheds fs WHERE fs.shed_id=s.id AND fs.flock_id=fl.id)
  OR EXISTS(SELECT 1 FROM public.shed_allocations sa WHERE sa.shed_id=s.id AND sa.flock_id=fl.id)
  OR EXISTS(SELECT 1 FROM public.flock_transfers tr WHERE tr.to_shed_id=s.id AND tr.flock_id=fl.id)
)
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '19';
