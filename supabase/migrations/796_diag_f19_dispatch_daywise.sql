-- Migration 796 (READ ONLY): the farm says the early dispatches were recorded
-- as a lump and only later ones carry day-wise production detail. If that is
-- so, attributing eggs back to the week they were laid works only from the
-- date the day-wise detail begins -- before it, one line carries several days
-- and the attribution is a guess wearing a number's clothes.
--
-- So: every Flock 19 dispatch, in date order, with how many production-date
-- lines it has and what span they cover.

SELECT 'dispatches' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT d.dispatch_date::text
                 || ' dc=' || COALESCE(d.dc_no::text, '-')
                 || ' eggs=' || COALESCE(d.total_dispatched, 0)
                 || ' lines=' || count(l.id)
                 || ' prod=' || COALESCE(min(l.prod_date)::text, '-')
                 || '..' || COALESCE(max(l.prod_date)::text, '-')
                 || ' days=' || count(DISTINCT l.prod_date) AS t
            FROM public.he_dispatch d
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.he_dispatch_lines l ON l.dispatch_id = d.id
           WHERE f.flock_no::text = '19'
           GROUP BY d.id, d.dispatch_date, d.dc_no, d.total_dispatched
       ) x) AS all_dispatches;

-- Where does day-wise detail actually begin, across the whole app?
SELECT 'daywise_start' AS chk,
       (SELECT min(d.dispatch_date)::text
          FROM public.he_dispatch d
         WHERE (SELECT count(*) FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id) > 1) AS first_multi_line_dispatch,
       (SELECT count(*) FROM public.he_dispatch d
         WHERE (SELECT count(*) FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id) > 1) AS dispatches_with_daywise,
       (SELECT count(*) FROM public.he_dispatch d
         WHERE (SELECT count(*) FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id) = 1) AS dispatches_single_line,
       (SELECT count(*) FROM public.he_dispatch d
         WHERE NOT EXISTS (SELECT 1 FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id)) AS dispatches_no_lines;
