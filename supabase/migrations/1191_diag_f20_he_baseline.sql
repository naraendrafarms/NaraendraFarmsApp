-- Migration 1191: read-only. Flock 20's hatching-egg dispatch position BEFORE
-- the owner's upload, so the import can be checked against a known baseline
-- rather than against an impression.
--
-- Taken while the upload is being prepared. Every figure here is a "before"
-- number: after the load, the same queries re-run and the difference is exactly
-- what the sheet added.
--
-- Nothing is written.

-- [1] The headline: how much HE dispatch Flock 20 already has.
SELECT count(*)::int AS dispatches,
       COALESCE(min(dispatch_date)::text,'-') || ' to ' || COALESCE(max(dispatch_date)::text,'-') AS span,
       COALESCE(sum(total_dispatched),0)::bigint AS eggs_dispatched,
       COALESCE(sum(free_eggs),0)::bigint AS free_eggs,
       round(COALESCE(sum(amount),0))::numeric AS value,
       count(*) FILTER (WHERE invoice_no IS NOT NULL)::int AS invoiced
FROM public.he_dispatch d
WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20');

-- [2] By month, so a gap in the existing history is visible before anything is
-- added -- a month the sheet covers that the app already has is where a
-- duplicate would land.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.m), 'NONE') AS by_month
FROM (
  SELECT to_char(d.dispatch_date,'YYYY-MM') AS m,
         to_char(d.dispatch_date,'YYYY-MM') || ': ' || count(*) || ' dispatches, '
           || COALESCE(sum(d.total_dispatched),0) || ' eggs' AS txt
  FROM public.he_dispatch d
  WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20')
  GROUP BY to_char(d.dispatch_date,'YYYY-MM')
) t;

-- [3] Grade split and day-wise detail. A dispatch with no lines carries only a
-- header total, so eggs cannot be attributed to the day they were laid -- worth
-- knowing which part of the history is which before adding more.
SELECT count(*)::int AS dispatches,
       count(*) FILTER (WHERE ln.n > 0)::int AS with_daywise_lines,
       count(*) FILTER (WHERE COALESCE(ln.n,0) = 0)::int AS header_only,
       COALESCE(sum(d.grade_a),0)::bigint AS hdr_grade_a,
       COALESCE(sum(d.grade_b),0)::bigint AS hdr_grade_b,
       COALESCE(sum(d.grade_c),0)::bigint AS hdr_grade_c
FROM public.he_dispatch d
LEFT JOIN (SELECT dispatch_id, count(*) AS n FROM public.he_dispatch_lines GROUP BY dispatch_id) ln
       ON ln.dispatch_id = d.id
WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20');

-- [4] Existing DC and invoice numbers on this flock -- the natural duplicate
-- key. If the sheet repeats one of these, it is a re-load of something already
-- present, not new history.
SELECT count(DISTINCT d.dc_no)::int AS distinct_dc_nos,
       count(DISTINCT d.invoice_no)::int AS distinct_invoices,
       COALESCE(min(d.dc_no)::text,'-') || ' to ' || COALESCE(max(d.dc_no)::text,'-') AS dc_range,
       (SELECT count(*)::int FROM (
          SELECT d2.dc_no FROM public.he_dispatch d2
          WHERE d2.flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')
            AND d2.dc_no IS NOT NULL
          GROUP BY d2.dc_no HAVING count(*) > 1) x) AS dc_nos_already_duplicated
FROM public.he_dispatch d
WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20');

-- [5] Whether the eggs are even there to dispatch: HE eggs recorded in Flock
-- 20's daily records, against what has been dispatched so far. A sheet that
-- dispatches more than the sheds ever produced is the first thing to catch.
SELECT COALESCE(sum(dr.he_eggs),0)::bigint AS he_eggs_produced,
       (SELECT COALESCE(sum(total_dispatched),0)::bigint FROM public.he_dispatch
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')) AS he_eggs_dispatched,
       COALESCE(sum(dr.he_eggs),0)::bigint
         - (SELECT COALESCE(sum(total_dispatched),0)::bigint FROM public.he_dispatch
            WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='20')) AS undispatched_so_far
FROM public.daily_records dr
WHERE dr.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '20');
