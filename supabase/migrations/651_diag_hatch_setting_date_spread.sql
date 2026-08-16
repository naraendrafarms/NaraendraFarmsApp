-- Diagnostic only. 650 answered most of it (395 batches, only 1 with a hatch
-- date, 394 linked to the hatchery master) but its statement 2 -- the setting
-- date spread -- printed nothing in the job log, and a statement that vanishes
-- is exactly what a silently swallowed error looks like. The spread is the
-- proof that every imported row landed on the SAME made-up date, so it is
-- asked again on its own rather than assumed.

SELECT COALESCE(string_agg(sd || ' x ' || c, ' | ' ORDER BY c DESC), 'NONE') AS setting_date_spread
FROM (SELECT setting_date::text AS sd, COUNT(*) AS c
      FROM public.hatch_batches GROUP BY setting_date
      ORDER BY COUNT(*) DESC LIMIT 6) x;

SELECT COUNT(*)::text AS batches_total,
       COUNT(*) FILTER (WHERE setting_date = CURRENT_DATE)::text AS setting_date_is_today,
       COUNT(hatch_date)::text AS with_hatch_date,
       COUNT(DISTINCT setting_date)::text AS distinct_setting_dates
FROM public.hatch_batches;
