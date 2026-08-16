-- Diagnostic only. No schema change, no data change.
--
-- Age@Prod needs the date the eggs were LAID. Today it is taken only from the
-- lines of the dispatch a hatch batch is LINKED to, and when there is no link
-- it silently falls back to the setting date, which makes Age@Prod a copy of
-- Age@Setting.
--
-- The question: without that link, does the app already hold enough to know
-- the production date anyway? Three candidate routes, checked against the real
-- data rather than assumed:
--   a) match on invoice number (batch.invoice_no = dispatch.invoice_no)
--   b) the flock's own dispatches around the setting date, using their lines
--   c) he_dispatch.prod_date on the header, if it is filled

-- 1. Do dispatch LINES carry prod_date at all, and for how many dispatches?
SELECT COUNT(*) AS dispatch_line_rows,
       COUNT(prod_date) AS lines_with_prod_date,
       COUNT(DISTINCT dispatch_id) AS dispatches_covered,
       MIN(prod_date)::text AS earliest_prod, MAX(prod_date)::text AS latest_prod
FROM public.he_dispatch_lines;

-- 2. And the dispatch HEADER's own prod_date -- a second possible source.
SELECT COUNT(*) AS dispatches,
       COUNT(prod_date) AS headers_with_prod_date,
       COUNT(invoice_no) AS with_invoice_no,
       COUNT(dc_no) AS with_dc_no
FROM public.he_dispatch;

-- 3. The one existing hatch batch, and what it holds to match on.
SELECT COALESCE(b.invoice_no,'(none)') AS batch_invoice,
       b.setting_date::text AS setting_date,
       COALESCE(b.dispatch_id::text,'(not linked)') AS dispatch_id,
       COALESCE(f.flock_no,'(no flock)') AS flock_no,
       b.eggs_set
FROM public.hatch_batches b LEFT JOIN public.flocks f ON f.id = b.flock_id;

-- 4. ROUTE B: that flock's dispatches in the three weeks before its setting
--    date -- eggs set on 22/07 must have been laid before it. If dispatches
--    exist here, the production date is knowable without any link.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NO DISPATCHES IN WINDOW') AS candidate_dispatches
FROM (
  SELECT d.dispatch_date::text || ': ' || COALESCE(d.invoice_no, 'DC-' || COALESCE(d.dc_no::text,'?'))
         || ' — ' || d.total_dispatched || ' eggs, header prod ' || COALESCE(d.prod_date::text,'none')
         || ', lines ' || (SELECT COUNT(*) FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id)
         || ' (prod ' || COALESCE((SELECT MIN(l.prod_date)::text FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id),'none')
         || '..' || COALESCE((SELECT MAX(l.prod_date)::text FROM public.he_dispatch_lines l WHERE l.dispatch_id = d.id),'none') || ')' AS line
  FROM public.he_dispatch d
  WHERE d.flock_id = (SELECT flock_id FROM public.hatch_batches LIMIT 1)
    AND d.dispatch_date BETWEEN (SELECT setting_date - 21 FROM public.hatch_batches LIMIT 1)
                            AND (SELECT setting_date FROM public.hatch_batches LIMIT 1)
) x;

-- 5. Does the dispatched quantity in that window resemble the eggs set (10,080)?
--    If one dispatch matches the batch almost exactly, the batch can be matched
--    to it automatically instead of by hand.
SELECT COALESCE(string_agg(d.dispatch_date::text || ' = ' || d.total_dispatched, ', ' ORDER BY d.dispatch_date), 'NONE') AS quantities_in_window,
       (SELECT eggs_set FROM public.hatch_batches LIMIT 1) AS batch_eggs_set
FROM public.he_dispatch d
WHERE d.flock_id = (SELECT flock_id FROM public.hatch_batches LIMIT 1)
  AND d.dispatch_date BETWEEN (SELECT setting_date - 21 FROM public.hatch_batches LIMIT 1)
                          AND (SELECT setting_date FROM public.hatch_batches LIMIT 1);
