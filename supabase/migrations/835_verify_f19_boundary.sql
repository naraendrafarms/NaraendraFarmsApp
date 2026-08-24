-- Migration 835 (READ ONLY): fixed boundary check (834's version had a type
-- mismatch coalescing integer against '?').
SELECT 'boundary_check' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ' last_import_close=' || prev.closing_female::text
            || ' first_live_open=' || nxt.opening_female::text
            || CASE WHEN prev.closing_female = nxt.opening_female THEN ' OK' ELSE ' MISMATCH' END) AS t
      FROM public.sheds s
      JOIN LATERAL (
        SELECT d.closing_female FROM public.daily_records d
        JOIN public.flocks f ON f.id = d.flock_id
        WHERE f.flock_no::text='19' AND d.shed_id = s.id AND d.record_date < '2025-06-23'
        ORDER BY d.record_date DESC LIMIT 1
      ) prev ON true
      JOIN LATERAL (
        SELECT d.opening_female FROM public.daily_records d
        JOIN public.flocks f ON f.id = d.flock_id
        WHERE f.flock_no::text='19' AND d.shed_id = s.id AND d.record_date >= '2025-06-23'
        ORDER BY d.record_date ASC LIMIT 1
      ) nxt ON true
  ) x;
