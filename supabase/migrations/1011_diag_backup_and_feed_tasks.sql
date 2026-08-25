SELECT title, left(description, 550) AS d FROM public.tasks
WHERE task_type='development' AND title = '4 backup tables have RLS enabled with no policy';

SELECT title, left(description, 550) AS d FROM public.tasks
WHERE task_type='development' AND title = 'Audit log is filling the free plan (166 MB of 207 MB)';

SELECT title, left(description, 550) AS d FROM public.tasks
WHERE task_type='development' AND title = 'Feed type mapping: L1-L5 to BRE 1 / BRE 2';
