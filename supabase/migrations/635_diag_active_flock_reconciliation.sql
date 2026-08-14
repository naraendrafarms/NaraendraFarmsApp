-- Diagnostic only. Corrects 634, which was wrong.
--
-- 634 reconciled from flocks.total_placed_f — the quantity PURCHASED. That is
-- only a valid starting point if the daily records begin on the placement date
-- and never miss a day. Where entry started later, or a shed's first row opens
-- with a count carried in from paper, the purchase figure is not the opening
-- balance and the "unaccounted" number it produced (1,612 ♀ / 357 ♂ on Flock
-- 20) is measuring the gap between purchase and the start of records, not
-- missing birds. That was my error.
--
-- The right starting point is the FIRST daily record itself: for each flock and
-- each shed, the opening count on that shed's earliest record date. Sheds can
-- start on different dates, so it must be taken per shed and then summed.
--
-- Scope: the three active flocks — 20, 22, 23.

-- 1. Where the records actually start, per flock, and what they open with.
SELECT COALESCE(string_agg(flock_no || ': from ' || first_date::text
         || ' opening ♀' || open_f || ' ♂' || open_m
         || ' (' || sheds || ' shed' || CASE WHEN sheds > 1 THEN 's' ELSE '' END || ')',
         ' | ' ORDER BY flock_no), 'NONE') AS record_start
FROM (
  SELECT f.flock_no, MIN(x.first_date) AS first_date,
         SUM(x.open_f) AS open_f, SUM(x.open_m) AS open_m, COUNT(*) AS sheds
  FROM (
    SELECT DISTINCT ON (d.flock_id, d.shed_id)
           d.flock_id, d.record_date AS first_date,
           COALESCE(d.opening_female,0) AS open_f, COALESCE(d.opening_male,0) AS open_m
    FROM public.daily_records d
    ORDER BY d.flock_id, d.shed_id, d.record_date
  ) x JOIN public.flocks f ON f.id = x.flock_id
  WHERE f.flock_no IN ('20','22','23')
  GROUP BY f.flock_no
) y;

-- 2. Movements since those first records, per flock.
SELECT COALESCE(string_agg(flock_no || ': in ♀' || in_f || ' ♂' || in_m
         || ' | mort ♀' || mort_f || ' ♂' || mort_m
         || ' | cull ♀' || cull_f || ' ♂' || cull_m
         || ' | out ♀' || out_f || ' ♂' || out_m, '  ||  ' ORDER BY flock_no), 'NONE') AS movements
FROM (
  SELECT f.flock_no,
         COALESCE(SUM(d.transfer_in_female),0) AS in_f, COALESCE(SUM(d.transfer_in_male),0) AS in_m,
         COALESCE(SUM(d.mortality_female),0) AS mort_f, COALESCE(SUM(d.mortality_male),0) AS mort_m,
         COALESCE(SUM(d.cull_female),0) AS cull_f, COALESCE(SUM(d.cull_male),0) AS cull_m,
         COALESCE(SUM(d.transfer_female),0) AS out_f, COALESCE(SUM(d.transfer_male),0) AS out_m
  FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
  WHERE f.flock_no IN ('20','22','23')
  GROUP BY f.flock_no
) z;

-- 3. THE ANSWER: first opening + in − mortality − cull − out, against the birds
--    standing today. Zero means every bird is accounted for.
SELECT COALESCE(string_agg(flock_no
         || ': ♀ expected ' || exp_f || ' actual ' || cur_f || ' diff ' || (cur_f - exp_f)
         || '  ·  ♂ expected ' || exp_m || ' actual ' || cur_m || ' diff ' || (cur_m - exp_m),
         '  ||  ' ORDER BY flock_no), 'NONE') AS reconciliation
FROM (
  SELECT f.flock_no,
         s.open_f + COALESCE(m.in_f,0) - COALESCE(m.mort_f,0) - COALESCE(m.cull_f,0) - COALESCE(m.out_f,0) AS exp_f,
         s.open_m + COALESCE(m.in_m,0) - COALESCE(m.mort_m,0) - COALESCE(m.cull_m,0) - COALESCE(m.out_m,0) AS exp_m,
         COALESCE(v.current_female,0) AS cur_f, COALESCE(v.current_male,0) AS cur_m
  FROM public.flocks f
  JOIN (SELECT flock_id, SUM(open_f) AS open_f, SUM(open_m) AS open_m FROM (
          SELECT DISTINCT ON (flock_id, shed_id) flock_id,
                 COALESCE(opening_female,0) AS open_f, COALESCE(opening_male,0) AS open_m
          FROM public.daily_records ORDER BY flock_id, shed_id, record_date) a
        GROUP BY flock_id) s ON s.flock_id = f.id
  LEFT JOIN (SELECT flock_id,
               SUM(transfer_in_female) AS in_f, SUM(transfer_in_male) AS in_m,
               SUM(mortality_female) AS mort_f, SUM(mortality_male) AS mort_m,
               SUM(cull_female) AS cull_f, SUM(cull_male) AS cull_m,
               SUM(transfer_female) AS out_f, SUM(transfer_male) AS out_m
             FROM public.daily_records GROUP BY flock_id) m ON m.flock_id = f.id
  LEFT JOIN public.v_flock_summary v ON v.id = f.id
  WHERE f.flock_no IN ('20','22','23')
) r;

-- 4. Are these three actually the active ones, and are there others still open?
SELECT COALESCE(string_agg(flock_no || '=' || status, ', ' ORDER BY flock_no), 'NONE') AS all_open_flocks
FROM public.flocks WHERE status <> 'closed';

-- 5. Days with NO record at all inside each flock's own recording period — a
--    missing day is the one thing the balance check cannot see, because the
--    chain only compares consecutive days and simply skips a gap.
SELECT COALESCE(string_agg(flock_no || ': ' || missing || ' missing day(s) between '
         || first_date::text || ' and ' || last_date::text, ' | ' ORDER BY flock_no), 'NONE') AS gaps
FROM (
  SELECT f.flock_no, MIN(d.record_date) AS first_date, MAX(d.record_date) AS last_date,
         (MAX(d.record_date) - MIN(d.record_date) + 1) - COUNT(DISTINCT d.record_date) AS missing
  FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
  WHERE f.flock_no IN ('20','22','23')
  GROUP BY f.flock_no
) g WHERE missing > 0;
