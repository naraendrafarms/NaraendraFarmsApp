-- READ ONLY.  No INSERT, UPDATE, DELETE or DDL.
-- The screenshot showed cumulative depletion ACTUAL reading 0.0% on every row
-- while the standard climbed 0.1% to 3.3%. Is that a display fault, or does
-- the data really carry no female deaths in those weeks?
-- Depletion in the book is mortality AND culls; the page accumulates mortality
-- only, so both are counted here separately.

SELECT 'F19 placedF=' || COALESCE(MAX(f.total_placed_f), 0)
    || ' mortF=' || COALESCE(SUM(d.mortality_female), 0)
    || ' cullF=' || COALESCE(SUM(d.cull_female), 0)
    || ' daysWithMortF=' || COUNT(*) FILTER (WHERE COALESCE(d.mortality_female,0) > 0)
    || ' cumDep%=' || ROUND((COALESCE(SUM(d.mortality_female),0) + COALESCE(SUM(d.cull_female),0))::numeric
                            / NULLIF(MAX(f.total_placed_f), 0) * 100, 2)
    AS f19_depletion
  FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
 WHERE f.flock_no = '19';

SELECT 'F20 placedF=' || COALESCE(MAX(f.total_placed_f), 0)
    || ' mortF=' || COALESCE(SUM(d.mortality_female), 0)
    || ' cullF=' || COALESCE(SUM(d.cull_female), 0)
    || ' daysWithMortF=' || COUNT(*) FILTER (WHERE COALESCE(d.mortality_female,0) > 0)
    || ' cumDep%=' || ROUND((COALESCE(SUM(d.mortality_female),0) + COALESCE(SUM(d.cull_female),0))::numeric
                            / NULLIF(MAX(f.total_placed_f), 0) * 100, 2)
    AS f20_depletion
  FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
 WHERE f.flock_no = '20';
