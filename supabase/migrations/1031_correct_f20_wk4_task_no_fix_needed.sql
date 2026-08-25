UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nCORRECTION: owner confirmed 2025-06-24 shed 10 mortality of 18 is correct per the source Excel, and no cull-bird sale appears in the Excel for 22-28 Jun 2025. The earlier "39=23+16" match was a false positive caused by a week-of-age alignment mismatch (app week computed from flocks.placement_date=2025-06-01, but chicks were actually placed 2025-05-30/05-31 per the report''s DC consignments, shifting which calendar days fall in "week 4"). No data change made.'
WHERE title = 'Flock 20 week 4 (22-28 Jun 2025): cull-bird sale folded into mortality'
  AND task_type = 'development';
