-- Diagnostic only. The Hitech rate rule, measured against what was actually
-- invoiced, because the wording leaves two things genuinely open:
--   * "35% less" -- 35% BELOW the Association rate (x 0.65), or the Association
--     rate less 35 paise, or something else again;
--   * "upto 29/7" and "from 30/1" -- which months and which years those are.
-- Rather than guess and quietly misprice a year of dispatches, compare each
-- dispatch's own rate against the Association rate for its week and let the
-- numbers say which rule was in force and when it changed.

-- 1. Which parties look like Hitech, and how many dispatches each has.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NONE') AS hitech_parties
FROM (
  SELECT p.name || ' [' || p.type || '] dispatches=' ||
         (SELECT COUNT(*) FROM public.he_dispatch d WHERE d.party_id = p.id) AS line
  FROM public.parties p
  WHERE p.name ILIKE '%hitech%' OR p.name ILIKE '%hi tech%' OR p.name ILIKE '%hatch fresh%'
) x;

-- 2. Every dispatch with its own rate, the Association rate for that week, the
--    difference and the RATIO. A ratio near 0.65 means "35% less"; a difference
--    near -1.5 means "Association - 1.5".
SELECT string_agg(line, '  ||  ' ORDER BY dd) AS dispatch_vs_association
FROM (
  SELECT d.dispatch_date AS dd,
         to_char(d.dispatch_date,'DD/MM/YY')
           || ' ' || COALESCE(p.name,'(no party)')
           || ' rate=' || COALESCE(d.rate::text,'-')
           || ' assoc=' || r.rate
           || ' diff=' || ROUND((d.rate - r.rate)::numeric, 2)
           || ' ratio=' || ROUND((d.rate / NULLIF(r.rate,0))::numeric, 4) AS line
  FROM public.he_dispatch d
  LEFT JOIN public.parties p ON p.id = d.party_id
  JOIN public.he_rate_register r ON d.dispatch_date BETWEEN r.week_start AND r.week_end
  WHERE d.rate IS NOT NULL
) y;

-- 3. Do the differences cluster? If one rule applied throughout, one of these
--    two counts should be close to the total.
SELECT COUNT(*)::text AS dispatches_priced,
       COUNT(*) FILTER (WHERE ABS((d.rate - r.rate) + 1.5) < 0.01)::text AS exactly_assoc_minus_1_50,
       COUNT(*) FILTER (WHERE ABS((d.rate / NULLIF(r.rate,0)) - 0.65) < 0.005)::text AS exactly_35_pct_less,
       COALESCE(to_char(MIN(d.dispatch_date),'DD/MM/YYYY'),'-') AS first_priced,
       COALESCE(to_char(MAX(d.dispatch_date),'DD/MM/YYYY'),'-') AS last_priced
FROM public.he_dispatch d
JOIN public.he_rate_register r ON d.dispatch_date BETWEEN r.week_start AND r.week_end
WHERE d.rate IS NOT NULL;

-- 4. What the vendor-rate table holds today, and its shape -- one flat diff per
--    party, with no date validity anywhere.
SELECT COALESCE(string_agg(p.name || ' diff=' || v.diff || COALESCE(' (' || v.remarks || ')',''), ' | '), 'NONE') AS vendor_diffs_now
FROM public.he_vendor_rate_diff v LEFT JOIN public.parties p ON p.id = v.party_id;

SELECT COALESCE(string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS he_vendor_rate_diff_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'he_vendor_rate_diff';
