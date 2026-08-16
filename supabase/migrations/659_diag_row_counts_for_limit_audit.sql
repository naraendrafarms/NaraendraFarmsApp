-- Diagnostic only. Exact row count of every table and view in public, so the
-- .limit() audit is measured rather than guessed. A .limit(500) on a 90-row
-- table is harmless; the same limit on a 4,000-row table silently drops 3,500
-- rows out of a total, an average or an export with nothing on screen saying so
-- -- exactly what .limit(200) did to the 395 hatch batches.
--
-- Counted through query_to_xml so no table name is typed by hand and nothing
-- can be missed by my not thinking of it.

-- 1. Every BASE TABLE with 90+ rows, biggest first, as name=count pairs.
SELECT COALESCE(string_agg(tbl || '=' || cnt, ', ' ORDER BY cnt DESC), 'NONE') AS tables_over_90_rows
FROM (
  SELECT table_name AS tbl,
         (xpath('/row/c/text()', query_to_xml(
            format('SELECT COUNT(*) AS c FROM public.%I', table_name),
            false, true, '')))[1]::text::bigint AS cnt
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) x WHERE cnt >= 90;

-- 2. The same for VIEWS -- a view behind a limit truncates just as silently,
--    and v_po_grn_rate sits behind .limit(500) in two different pages.
SELECT COALESCE(string_agg(v || '=' || cnt, ', ' ORDER BY cnt DESC), 'NONE') AS views_over_90_rows
FROM (
  SELECT table_name AS v,
         (xpath('/row/c/text()', query_to_xml(
            format('SELECT COUNT(*) AS c FROM public.%I', table_name),
            false, true, '')))[1]::text::bigint AS cnt
  FROM information_schema.views
  WHERE table_schema = 'public'
) y WHERE cnt >= 90;

-- 3. PostgREST's own ceiling. Any client .limit() above this is capped by the
--    server regardless of what the code asks for, so a .limit(50000) in the
--    app may really be returning far fewer rows. db-max-rows unset = no cap.
SELECT COALESCE(current_setting('pgrst.db_max_rows', true), 'not set (no server cap)') AS pgrst_db_max_rows;
