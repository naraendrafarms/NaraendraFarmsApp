-- Migration 799 (READ ONLY): user says there is no Flock 19 cull sale on
-- 03/07/2026 anywhere in the app, and did not link/create one. Find every
-- table that could be showing this on screen for that date/flock, rather
-- than assume it's nhe_sales.

SELECT 'cash_book' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT c.id::text || ' cat=' || COALESCE(c.category,'-') || ' amt=' || COALESCE(c.amount,0)
                 || ' desc=' || COALESCE(c.description,'-') || ' nhe_sale_id=' || COALESCE(c.nhe_sale_id::text,'-')
                 || ' he_dispatch_id=' || COALESCE(c.he_dispatch_id::text,'-') AS t
            FROM public.cash_book c
           WHERE c.entry_date = '2026-07-03'
              AND (c.description ILIKE '%cull%' OR c.description ILIKE '%flock 19%' OR c.description ILIKE '%f19%' OR c.category ILIKE '%cull%')
       ) x) AS rows;

SELECT 'daily_records' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT d.record_date::text || ' cull_f=' || COALESCE(d.cull_female,0) || ' cull_m=' || COALESCE(d.cull_male,0) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '19' AND d.record_date = '2026-07-03'
             AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0)
       ) x) AS rows;

SELECT 'flock_transfers' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT ft.id::text || ' date=' || ft.transfer_date::text || ' type=' || COALESCE(ft.transfer_type,'-')
                 || ' qty_f=' || COALESCE(ft.female_qty,0) || ' qty_m=' || COALESCE(ft.male_qty,0) AS t
            FROM public.flock_transfers ft
            JOIN public.flocks f ON f.id = ft.flock_id
           WHERE f.flock_no::text = '19' AND ft.transfer_date = '2026-07-03'
       ) x) AS rows;

SELECT 'tasks' AS chk,
       (SELECT string_agg(t.title || ' | due=' || COALESCE(t.due_date::text,'-') || ' desc=' || left(COALESCE(t.description,''),120), ' || ')
          FROM public.tasks t
         WHERE (t.title ILIKE '%03/07/2026%' OR t.description ILIKE '%03/07/2026%'
             OR t.title ILIKE '%2026-07-03%' OR t.description ILIKE '%2026-07-03%')) AS rows;

SELECT 'audit_log' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT a.table_name || ' ' || a.operation || ' at=' || a.created_at::text
                 || ' row=' || left(COALESCE(a.new_data::text, a.old_data::text, ''), 200) AS t
            FROM public.audit_log a
           WHERE a.table_name = 'nhe_sales'
             AND (a.new_data::text ILIKE '%2026-07-03%' OR a.old_data::text ILIKE '%2026-07-03%')
           ORDER BY a.created_at DESC
           LIMIT 10
       ) x) AS rows;
