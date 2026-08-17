-- Diagnostic only. The breed standard names feeds in Venco's own codes -- CF,
-- GF, DF, PBF, BRE 1, BRE 2, MF -- and the farm says its own feed names are
-- different. Before any feed comparison is built, read what the app actually
-- calls its feeds, so the mapping is made from real names rather than assumed
-- ones.
SELECT COALESCE(string_agg(code || ' = ' || name || CASE WHEN is_active THEN '' ELSE ' (inactive)' END, ' | ' ORDER BY code), 'NONE') AS app_feed_types
FROM public.feed_types;

SELECT COALESCE(string_agg(DISTINCT feed_type, ', ' ORDER BY feed_type), 'NONE') AS standard_feed_codes
FROM public.breed_standard WHERE feed_type IS NOT NULL;

-- What the daily feed entries actually reference, in case shed-level entry uses
-- something other than the feed_types master.
SELECT COUNT(*)::text AS daily_feed_rows,
       COUNT(DISTINCT feed_type_id)::text AS distinct_feed_types_used
FROM public.daily_feed;
